// Edutrack Math — per-question mastery ledger
// Loaded by every sub-app before app.js. Exposes window.MathProgress.
//
// Storage shape (localStorage["edutrack_math_progress_v1"]):
//   {
//     version: 1,
//     records: {
//       "<appId>:<qid>": {
//         correct: number,
//         wrong: number,
//         attempts: number,
//         totalTimeMs: number,
//         lastSeen: number (epoch ms),
//         lastSource: "guided" | "independent" | "homework" | "exam" | "retry"
//       },
//       ...
//     }
//   }

(function () {
    const STORAGE_KEY = 'edutrack_math_progress_v1';
    const SCHEMA_VERSION = 1;
    const MASTERY_THRESHOLD = 2;            // correct - wrong >= 2 to be mastered
    const MASTERY_DECAY_MS = 21 * 86_400_000; // 21 days — superseded by the ladder below,
                                              // kept only so _internals stays backward-compatible.

    // ── The review ladder ─────────────────────────────────────────────
    // Mastery does not expire on a flat clock. Each consecutive correct answer
    // pushes the next sighting further out; a miss drops the question to the
    // bottom rung.
    //
    //   1st correct → back in 1 day    4th  → back in 3 weeks
    //   2nd         → 3 days           5th+ → back in 6 weeks, then maintenance
    //   3rd         → 1 week
    //
    // This replaces the old flat 21-day decay, which treated a question answered
    // right twice exactly like one answered right nine times: both rested 21 days,
    // then both came back. The ladder spends the student's time where it is worth
    // spending — often on the shaky ones, rarely on the solid ones (`MR-1`, `MR-3`
    // in the root handbook).
    //
    // The tier machinery it feeds is UNCHANGED and must stay that way: when a rung
    // elapses, isMastered() goes false, tierFor() returns 'learning', and
    // prioritize() serves 'learning' AHEAD of 'unseen' — so the question actually
    // comes back. The sister R&W app had that tier order inverted, and a question
    // the student had learned was never drawn again. See AGENTS.md.
    const REVIEW_LADDER_DAYS = [1, 3, 7, 21, 42];
    const DAY_MS = 86_400_000;

    function _emptyLedger() {
        return { version: SCHEMA_VERSION, records: {} };
    }

    function _migrate(raw) {
        if (!raw || typeof raw !== 'object') return _emptyLedger();
        if (!raw.version) return _emptyLedger();
        // Future: add migrations here as schema evolves.
        if (raw.version === SCHEMA_VERSION) return raw;
        // Unknown future version — keep raw data but treat as empty for safety
        return _emptyLedger();
    }

    function _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return _emptyLedger();
            return _migrate(JSON.parse(raw));
        } catch (e) {
            return _emptyLedger();
        }
    }

    function _save(ledger) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
        } catch (e) {
            // localStorage may be full or disabled (incognito with quotas)
        }
    }

    function _key(appId, qid) {
        return `${appId}:${qid}`;
    }

    function _emptyRecord() {
        return {
            correct: 0,
            wrong: 0,
            attempts: 0,
            totalTimeMs: 0,
            lastSeen: 0,
            lastSource: null,
            streak: 0,         // consecutive corrects — which rung of the ladder
            predicted: 0       // answers reached through a written prediction (PS-4)
        };
    }

    // Consecutive corrects. Ledgers written before the ladder existed carry no
    // `streak`, so infer one rather than resetting real students to zero: credit
    // the net corrects they have already banked.
    function _streak(rec) {
        if (!rec) return 0;
        if (typeof rec.streak === 'number') return rec.streak;
        return Math.max(0, _net(rec));
    }

    // When this question should next be put in front of the student.
    function _dueAt(rec) {
        if (!rec || !rec.lastSeen) return 0;
        const s = _streak(rec);
        if (s <= 0) return rec.lastSeen;   // not on the ladder — it is already due
        const rung = REVIEW_LADDER_DAYS[Math.min(s, REVIEW_LADDER_DAYS.length) - 1];
        return rec.lastSeen + rung * DAY_MS;
    }

    function _isDue(rec) {
        if (!rec || !rec.lastSeen) return false;
        return Date.now() >= _dueAt(rec);
    }

    // Record a single answer. source affects scoring weight:
    //   exam answers count 2x correct, others 1x.
    // A wrong answer increments wrong and removes 1 from correct (min 0).
    //
    // meta (optional) — { predicted: bool }: whether the student committed a written
    // prediction before the options were revealed. Counted, not just flagged, so the
    // tutor can see the rate: `predicted` against `attempts` is how you spot someone
    // clicking straight past the gate. It is deliberately NOT part of scoring —
    // it describes how the answer was reached, not whether it was right.
    function recordAnswer(appId, qid, isCorrect, source, elapsedMs, meta) {
        if (!appId || !qid) return;
        const ledger = _load();
        const k = _key(appId, qid);
        const rec = ledger.records[k] || _emptyRecord();
        const weight = (source === 'exam') ? 2 : 1;

        // Read the rung BEFORE touching anything. _streak() falls back to net-correct
        // for pre-ladder ledgers, so computing it after correct++ would count a single
        // right answer as two rungs and double-space the question.
        const rung = _streak(rec);

        rec.attempts += 1;
        rec.totalTimeMs += (typeof elapsedMs === 'number' && elapsedMs >= 0) ? elapsedMs : 0;
        rec.lastSeen = Date.now();
        rec.lastSource = source || 'practice';
        if (meta && meta.predicted) rec.predicted = (rec.predicted || 0) + 1;

        if (isCorrect) {
            rec.correct += weight;
            rec.streak = rung + 1;      // climb a rung
        } else {
            rec.wrong += 1;
            rec.correct = Math.max(0, rec.correct - 1);
            rec.streak = 0;             // back to the bottom
        }

        ledger.records[k] = rec;
        _save(ledger);
        return rec;
    }

    function getRecord(appId, qid) {
        const ledger = _load();
        return ledger.records[_key(appId, qid)] || _emptyRecord();
    }

    function _net(rec) {
        return (rec.correct || 0) - (rec.wrong || 0);
    }

    // Mastered = net correct >= threshold AND its ladder rung has not yet elapsed.
    //
    // When the rung elapses the question is DUE: isMastered() goes false, tierFor()
    // drops it to 'learning', and prioritize() serves 'learning' ahead of 'unseen',
    // so it comes back. That is the whole review mechanism — do not "tidy" it.
    function isMastered(appId, qid) {
        const rec = getRecord(appId, qid);
        if (rec.attempts === 0) return false;
        if (_net(rec) < MASTERY_THRESHOLD) return false;
        if (_isDue(rec)) return false;
        return true;
    }

    // Struggling = answered at least once and net correct < 0 (more wrong than right)
    function isStruggling(appId, qid) {
        const rec = getRecord(appId, qid);
        return rec.attempts > 0 && _net(rec) < 0;
    }

    // Tier: 'wrong' (struggling), 'unseen', 'mastered', 'learning' (seen but not yet mastered or struggling)
    function tierFor(appId, qid) {
        const rec = getRecord(appId, qid);
        if (rec.attempts === 0) return 'unseen';
        if (isMastered(appId, qid)) return 'mastered';
        if (isStruggling(appId, qid)) return 'wrong';
        return 'learning';
    }

    function _shuffleInPlace(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Sort by lastSeen ASC so the longest-untouched questions surface first
    // and just-answered ones drift to the back of the bucket.
    function _sortByLastSeenAsc(appId, arr) {
        arr.sort((a, b) => {
            const ra = getRecord(appId, a.id);
            const rb = getRecord(appId, b.id);
            return (ra.lastSeen || 0) - (rb.lastSeen || 0);
        });
        return arr;
    }

    // Order questions wrong -> learning -> unseen -> mastered. Within the seen
    // tiers, surface the longest-untouched first so re-running a module in
    // Smart Mode doesn't replay the most-recently-answered items first.
    function prioritize(appId, questions) {
        const buckets = { wrong: [], learning: [], unseen: [], mastered: [] };
        questions.forEach(q => {
            const t = tierFor(appId, q.id);
            buckets[t].push(q);
        });
        return [
            ..._sortByLastSeenAsc(appId, buckets.wrong),
            ..._sortByLastSeenAsc(appId, buckets.learning),
            ..._shuffleInPlace(buckets.unseen),
            ..._sortByLastSeenAsc(appId, buckets.mastered)
        ];
    }

    // Summary across a set of question IDs (or all questions in an app's manifest).
    function summary(appId, questionIds) {
        const counts = { mastered: 0, struggling: 0, learning: 0, unseen: 0, total: questionIds.length };
        questionIds.forEach(qid => {
            const t = tierFor(appId, qid);
            if (t === 'wrong') counts.struggling += 1;
            else counts[t] += 1;
        });
        return counts;
    }

    // Build a "weak-area" set of N questions from a cross-module pool.
    // Prioritises wrong-tier first, then learning, then unseen, then mastered.
    // Caps at maxPerArchetype questions from the same archetype for breadth.
    // If pool has no archetype tags, the cap is ignored.
    function buildWeakAreaSet(appId, pool, count) {
        count = count || 10;
        const buckets = { wrong: [], learning: [], unseen: [], mastered: [] };
        pool.forEach(q => {
            if (!q || !q.id) return;
            buckets[tierFor(appId, q.id)].push(q);
        });
        // Within each seen tier, surface the longest-untouched first so a
        // just-answered set doesn't reappear immediately. Unseen all have
        // lastSeen=0, so a plain shuffle is fine there.
        _sortByLastSeenAsc(appId, buckets.wrong);
        _sortByLastSeenAsc(appId, buckets.learning);
        _shuffleInPlace(buckets.unseen);
        _sortByLastSeenAsc(appId, buckets.mastered);

        const result = [];
        const archCounts = {};
        const maxPerArchetype = Math.max(2, Math.ceil(count / 2));

        const tryAdd = (q) => {
            const arch = q.archetype || '__none__';
            if (arch !== '__none__' && (archCounts[arch] || 0) >= maxPerArchetype) return false;
            result.push(q);
            archCounts[arch] = (archCounts[arch] || 0) + 1;
            return true;
        };

        const ordered = [...buckets.wrong, ...buckets.learning, ...buckets.unseen, ...buckets.mastered];
        for (const q of ordered) {
            if (result.length >= count) break;
            tryAdd(q);
        }

        // If still short due to archetype cap, lift the cap as a second pass.
        if (result.length < count) {
            const picked = new Set(result.map(q => q.id));
            for (const q of ordered) {
                if (result.length >= count) break;
                if (!picked.has(q.id)) result.push(q);
            }
        }
        return result;
    }

    // Build a "balanced" fresh set of N questions from a cross-module pool.
    // Filters out questions seen recently (within `daysToAvoid` days), then
    // draws proportionally across difficulty buckets so the student gets a
    // representative spread instead of all-easy or all-hard.
    // Falls back to lifting the freshness filter or adjusting the distribution
    // when a difficulty bucket is too thin.
    function buildBalancedSet(appId, pool, options) {
        options = options || {};
        const count = options.count || 8;
        const daysToAvoid = options.daysToAvoid != null ? options.daysToAvoid : 7;
        const distribution = options.distribution || { Easy: 0.3, Medium: 0.4, Hard: 0.3 };
        const cutoff = Date.now() - daysToAvoid * 86_400_000;

        const isRecent = (q) => {
            const rec = getRecord(appId, q.id);
            return rec.lastSeen > 0 && rec.lastSeen > cutoff;
        };
        const diffOf = (q) => {
            const d = (q && q.difficulty) ? q.difficulty.toString().trim() : '';
            if (d === 'Easy' || d === 'Medium' || d === 'Hard') return d;
            return 'Other';
        };

        const fresh = { Easy: [], Medium: [], Hard: [], Other: [] };
        const recent = { Easy: [], Medium: [], Hard: [], Other: [] };
        pool.forEach(q => {
            if (!q || !q.id) return;
            const bucket = isRecent(q) ? recent : fresh;
            bucket[diffOf(q)].push(q);
        });
        Object.values(fresh).forEach(_shuffleInPlace);
        // Among recents, prefer the longest-untouched first so a just-completed
        // set doesn't reappear when the fresh pool runs thin.
        Object.values(recent).forEach(arr => _sortByLastSeenAsc(appId, arr));

        // Compute target counts per difficulty, rounded to sum to `count`
        const targets = { Easy: 0, Medium: 0, Hard: 0 };
        Object.keys(distribution).forEach(diff => {
            targets[diff] = Math.round(count * distribution[diff]);
        });
        let total = targets.Easy + targets.Medium + targets.Hard;
        while (total !== count) {
            if (total < count) { targets.Medium++; total++; }
            else { targets.Medium = Math.max(0, targets.Medium - 1); total--; }
        }

        const result = [];
        const picked = new Set();
        const take = (q) => {
            if (!q || picked.has(q.id)) return false;
            picked.add(q.id);
            result.push(q);
            return true;
        };

        // First pass: fill each difficulty bucket from "fresh" pool
        ['Easy', 'Medium', 'Hard'].forEach(diff => {
            let want = targets[diff];
            for (const q of fresh[diff]) {
                if (want <= 0) break;
                if (take(q)) want--;
            }
            // Second pass for this difficulty: fall back to "recent" pool
            for (const q of recent[diff]) {
                if (want <= 0) break;
                if (take(q)) want--;
            }
        });

        // If still under count (some diff bucket too thin), fill from anything
        if (result.length < count) {
            const rest = pool.filter(q => q && q.id && !picked.has(q.id));
            _shuffleInPlace(rest);
            for (const q of rest) {
                if (result.length >= count) break;
                take(q);
            }
        }

        _shuffleInPlace(result);
        return result.slice(0, count);
    }

    // Build a curated easy→medium→hard progression set.
    // Same balanced difficulty mix as buildBalancedSet but ORDERED so the
    // student sees easy ones first (Section A pedagogical scaffolding).
    // Prefers unseen over seen within each difficulty.
    function buildCuratedProgression(appId, pool, options) {
        options = options || {};
        const count = options.count || 10;
        const distribution = options.distribution || { Easy: 0.3, Medium: 0.4, Hard: 0.3 };

        const diffOf = (q) => {
            const d = (q && q.difficulty) ? q.difficulty.toString().trim() : '';
            if (d === 'Easy' || d === 'Medium' || d === 'Hard') return d;
            return 'Other';
        };

        // Bucket by difficulty; within each, unseen first, then seen
        const fresh = { Easy: [], Medium: [], Hard: [] };
        const seen = { Easy: [], Medium: [], Hard: [] };
        pool.forEach(q => {
            if (!q || !q.id) return;
            const diff = diffOf(q);
            if (diff === 'Other') return;
            const rec = getRecord(appId, q.id);
            if (rec.attempts > 0) seen[diff].push(q);
            else fresh[diff].push(q);
        });
        Object.values(fresh).forEach(_shuffleInPlace);
        // Within each seen bucket, surface least-recently-attempted first so
        // questions just completed don't reappear in the next Fresh Guided set.
        Object.values(seen).forEach(arr => _sortByLastSeenAsc(appId, arr));

        const targets = { Easy: 0, Medium: 0, Hard: 0 };
        Object.keys(distribution).forEach(d => {
            targets[d] = Math.round(count * distribution[d]);
        });
        let total = targets.Easy + targets.Medium + targets.Hard;
        while (total !== count) {
            if (total < count) { targets.Medium++; total++; }
            else { targets.Medium = Math.max(0, targets.Medium - 1); total--; }
        }

        const result = [];
        const picked = new Set();
        const take = (q) => {
            if (!q || picked.has(q.id)) return false;
            picked.add(q.id);
            result.push(q);
            return true;
        };

        // Pick in order Easy → Medium → Hard, unseen first within each
        ['Easy', 'Medium', 'Hard'].forEach(diff => {
            let want = targets[diff];
            for (const q of fresh[diff]) {
                if (want <= 0) break;
                if (take(q)) want--;
            }
            for (const q of seen[diff]) {
                if (want <= 0) break;
                if (take(q)) want--;
            }
        });

        // Fill from anything if short
        if (result.length < count) {
            const rest = pool.filter(q => q && q.id && !picked.has(q.id));
            _shuffleInPlace(rest);
            for (const q of rest) {
                if (result.length >= count) break;
                take(q);
            }
        }

        // DON'T shuffle — keep easy→medium→hard order. But for the within-diff
        // ordering, we want a stable easy-first then medium then hard sequence.
        // Already in that order due to the iteration above; just truncate.
        return result.slice(0, count);
    }

    // Build a proportional exam-style sample.
    // Composition matches the question bank's archetype distribution as closely
    // as possible (proxy for real SAT mix). Within each archetype, prefers
    // unseen first, then seen. Shuffled at the end so the student doesn't
    // anticipate the archetype sequence.
    function buildExamSample(appId, pool, options) {
        options = options || {};
        const count = options.count || 15;

        // Group pool by archetype
        const byArch = {};
        const noArch = [];
        pool.forEach(q => {
            if (!q || !q.id) return;
            const a = q.archetype || null;
            if (!a) noArch.push(q);
            else {
                if (!byArch[a]) byArch[a] = [];
                byArch[a].push(q);
            }
        });

        // If most of the pool is untagged, fall back to a balanced sample by difficulty
        const totalTagged = Object.values(byArch).reduce((s, arr) => s + arr.length, 0);
        if (totalTagged < count) {
            return buildBalancedSet(appId, pool, { count, daysToAvoid: 0 });
        }

        // Compute proportional target per archetype (rounded, then adjusted to sum to count)
        const archNames = Object.keys(byArch);
        const targets = {};
        let assigned = 0;
        archNames.forEach(a => {
            const ratio = byArch[a].length / totalTagged;
            targets[a] = Math.max(1, Math.round(count * ratio));
            assigned += targets[a];
        });
        // Trim or pad to exactly `count`
        while (assigned > count) {
            // Trim the archetype with the highest current target
            const biggest = archNames.reduce((a, b) => targets[a] > targets[b] ? a : b);
            if (targets[biggest] > 1) { targets[biggest]--; assigned--; }
            else { break; }
        }
        while (assigned < count) {
            const biggest = archNames.reduce((a, b) => byArch[a].length > byArch[b].length ? a : b);
            targets[biggest]++; assigned++;
        }

        // Pick from each archetype, unseen first
        const result = [];
        const picked = new Set();
        const take = (q) => {
            if (!q || picked.has(q.id)) return false;
            picked.add(q.id);
            result.push(q);
            return true;
        };

        archNames.forEach(a => {
            const want = targets[a];
            const items = byArch[a].slice();
            // Sort: unseen first, then by lastSeen ascending (older first)
            items.sort((x, y) => {
                const rx = getRecord(appId, x.id);
                const ry = getRecord(appId, y.id);
                if ((rx.attempts === 0) !== (ry.attempts === 0)) {
                    return rx.attempts === 0 ? -1 : 1;
                }
                return (rx.lastSeen || 0) - (ry.lastSeen || 0);
            });
            for (let i = 0; i < items.length && i < want; i++) take(items[i]);
        });

        // Fill any remainder from untagged or anywhere
        if (result.length < count) {
            const rest = [...noArch, ...pool].filter(q => q && q.id && !picked.has(q.id));
            _shuffleInPlace(rest);
            for (const q of rest) {
                if (result.length >= count) break;
                take(q);
            }
        }

        _shuffleInPlace(result);
        return result.slice(0, count);
    }

    // ── Trap analytics ────────────────────────────────────────────────
    // Every question carries `archetype`, `trapName` and `strategy`. The engine used
    // to show them once after the answer and throw them away, so the app could say
    // WHAT he got wrong and never WHAT HE KEEPS FALLING FOR. This keeps the running
    // tally that turns a wrong answer into a targeted next lesson (`AN-1`, `FS-3`).
    //
    // Ported from the sister R&W app (`recordTrapOutcome` / `getTopTraps`), under
    // this app's own namespace so the two never collide on a shared device.
    //
    // Storage shape (localStorage["edutrack_math_traps_v1"]):
    //   { version: 1, buckets: { "<trapName>": { wrong, total, skill } } }
    //
    // Questions with a named trap are bucketed by that name; anything else falls back
    // to a per-skill bucket, so an untagged question still counts for something.
    // "Skill" here is the question's archetype — the closest analogue to the R&W
    // skill, and what the set-builders already reason about.
    const TRAP_STORAGE_KEY = 'edutrack_math_traps_v1';
    const TRAP_SCHEMA_VERSION = 1;

    function _emptyTraps() {
        return { version: TRAP_SCHEMA_VERSION, buckets: {} };
    }

    function _loadTraps() {
        try {
            const raw = localStorage.getItem(TRAP_STORAGE_KEY);
            if (!raw) return _emptyTraps();
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return _emptyTraps();
            if (parsed.version !== TRAP_SCHEMA_VERSION) return _emptyTraps();
            if (!parsed.buckets || typeof parsed.buckets !== 'object') return _emptyTraps();
            return parsed;
        } catch (e) {
            return _emptyTraps();
        }
    }

    function _saveTraps(traps) {
        try { localStorage.setItem(TRAP_STORAGE_KEY, JSON.stringify(traps)); } catch (e) {}
    }

    function getTrapStats() {
        return _loadTraps().buckets;
    }

    // Call on every graded answer, next to recordAnswer.
    function recordTrapOutcome(skill, trapName, isCorrect) {
        const named = trapName && String(trapName).trim();
        const hasSkill = skill && String(skill).trim();
        // Nothing to attribute this answer to — don't invent a bucket.
        if (!named && !hasSkill) return;
        const bucket = named ? String(trapName).trim() : String(skill).trim() + ' — general';
        const traps = _loadTraps();
        if (!traps.buckets[bucket]) traps.buckets[bucket] = { wrong: 0, total: 0, skill: '' };
        traps.buckets[bucket].total += 1;
        if (!isCorrect) traps.buckets[bucket].wrong += 1;
        if (hasSkill) traps.buckets[bucket].skill = String(skill).trim();
        _saveTraps(traps);
        return traps.buckets[bucket];
    }

    // Most-fallen-for traps: buckets with at least `minTotal` attempts and at least
    // one miss, ranked by wrong-rate then by volume (so a 3/4 beats a 3/9, and a
    // 5-miss bucket beats a 2-miss bucket at the same rate).
    // Returns [{ bucket, skill, wrong, total, rate }].
    function getTopTraps(minTotal, limit) {
        minTotal = (typeof minTotal === 'number') ? minTotal : 3;
        limit = (typeof limit === 'number') ? limit : 6;
        const buckets = getTrapStats();
        return Object.keys(buckets)
            .map(bucket => {
                const s = buckets[bucket] || {};
                const total = s.total || 0;
                const wrong = s.wrong || 0;
                return { bucket, skill: s.skill || '', wrong, total, rate: total ? wrong / total : 0 };
            })
            .filter(t => t.total >= minTotal && t.wrong > 0)
            .sort((a, b) => (b.rate - a.rate) || (b.wrong - a.wrong))
            .slice(0, limit);
    }

    // Merge another trap map in (used by importData so a backup carries traps too).
    function mergeTrapStats(incoming) {
        if (!incoming || typeof incoming !== 'object') return false;
        const traps = _loadTraps();
        Object.keys(incoming).forEach(bucket => {
            const s = incoming[bucket];
            if (!s || typeof s !== 'object') return;
            if (!traps.buckets[bucket]) {
                traps.buckets[bucket] = { wrong: s.wrong || 0, total: s.total || 0, skill: s.skill || '' };
            } else {
                traps.buckets[bucket].wrong += s.wrong || 0;
                traps.buckets[bucket].total += s.total || 0;
                traps.buckets[bucket].skill = s.skill || traps.buckets[bucket].skill;
            }
        });
        _saveTraps(traps);
        return true;
    }

    // ── Cross-topic review draw ───────────────────────────────────────
    // The ladder resurfaces a due question within the topic app you are already in.
    // This is the hub-level version: "due, ANY app", so review is not siloed by
    // strand and the student meets the interleaving that teaches WHICH METHOD THIS
    // NEEDS (`MR-4`, `MR-7`).
    //
    // Records are keyed "<appId>:<qid>", so this is a filter over every record using
    // the ladder's own `_isDue`. Most-overdue first.
    //
    // An unseen question is NEVER review: `_isDue` requires a lastSeen, so a question
    // he has never met cannot appear here. That is the rule, not an accident — keep it.
    function dueAcrossApps(n) {
        n = (typeof n === 'number' && n > 0) ? n : 6;
        const ledger = _load();
        const now = Date.now();
        const due = [];
        Object.keys(ledger.records).forEach(k => {
            const rec = ledger.records[k];
            if (!rec || !rec.lastSeen) return;      // unseen is not review
            if (!_isDue(rec)) return;
            const sep = k.indexOf(':');
            if (sep <= 0) return;
            due.push({
                appId: k.slice(0, sep),
                qid: k.slice(sep + 1),
                dueAt: _dueAt(rec),
                overdueMs: now - _dueAt(rec),
                tier: isMastered(k.slice(0, sep), k.slice(sep + 1)) ? 'mastered' : tierFor(k.slice(0, sep), k.slice(sep + 1))
            });
        });
        due.sort((a, b) => b.overdueMs - a.overdueMs);
        return due.slice(0, n);
    }

    // How many questions are due for review across every app right now.
    // Used to label the hub's "Due review" entry without building the set.
    function countDueAcrossApps() {
        const ledger = _load();
        let n = 0;
        Object.keys(ledger.records).forEach(k => {
            const rec = ledger.records[k];
            if (rec && rec.lastSeen && _isDue(rec)) n++;
        });
        return n;
    }

    // How many questions in this app the student has attempted at least once.
    // Used to gate the "Weak-Area Set" CTA — needs some signal to be useful.
    function countAttempted(appId) {
        const ledger = _load();
        const prefix = appId + ':';
        let n = 0;
        for (const k in ledger.records) {
            if (k.indexOf(prefix) === 0 && (ledger.records[k].attempts || 0) > 0) n++;
        }
        return n;
    }

    // Return the subset of a session's questions that were answered incorrectly.
    // checkFn(userAnswer, question) -> bool (whether correct)
    function getMissed(questions, userAnswers, checkFn) {
        const missed = [];
        questions.forEach((q, i) => {
            const userA = userAnswers[i];
            if (userA === undefined || userA === null) return;
            if (!checkFn(userA, q)) missed.push(q);
        });
        return missed;
    }

    // Export the full ledger as a JSON string (for tutor review / backup).
    // Carries the trap map alongside the records — a backup that loses what he keeps
    // falling for is not a backup. Older exports have no `traps` key; importData
    // tolerates that.
    function exportData() {
        const out = _load();
        out.traps = getTrapStats();
        return JSON.stringify(out, null, 2);
    }

    // Merge another ledger into this one. Takes max of correct, sum of wrong/attempts/time,
    // and latest lastSeen. Trap buckets sum.
    function importData(jsonString) {
        let incoming;
        try { incoming = JSON.parse(jsonString); } catch { return false; }
        if (!incoming || !incoming.records) return false;
        if (incoming.traps) mergeTrapStats(incoming.traps);
        const current = _load();
        Object.keys(incoming.records).forEach(k => {
            const a = current.records[k] || _emptyRecord();
            const b = incoming.records[k];
            const bIsNewer = (b.lastSeen || 0) > (a.lastSeen || 0);
            current.records[k] = {
                correct: Math.max(a.correct || 0, b.correct || 0),
                wrong: (a.wrong || 0) + (b.wrong || 0),
                attempts: (a.attempts || 0) + (b.attempts || 0),
                totalTimeMs: (a.totalTimeMs || 0) + (b.totalTimeMs || 0),
                lastSeen: Math.max(a.lastSeen || 0, b.lastSeen || 0),
                lastSource: bIsNewer ? b.lastSource : a.lastSource,
                predicted: (a.predicted || 0) + (b.predicted || 0),
                // The rung belongs to whichever side answered it LAST — a streak is a
                // statement about consecutive answers, so the newer record's is the
                // true one. (Merging by max would let a stale backup re-space a
                // question the student has since missed.) Omitting it entirely, as
                // this merge did until now, silently reset every imported question's
                // ladder rung.
                streak: bIsNewer ? _streak(b) : _streak(a)
            };
        });
        _save(current);
        return true;
    }

    // Wipe all progress (used by debug page and "Reset progress" UI).
    // The trap map goes with it — a fresh start that keeps the old weakness map
    // would report traps for answers that no longer exist.
    function reset() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        try { localStorage.removeItem(TRAP_STORAGE_KEY); } catch (e) {}
    }

    // Clear the records for a specific list of questions: pairs = [{appId, qid}, ...].
    // Used by Custom Practice's "reset this difficulty set" so those questions
    // become fresh again. Returns how many records were removed.
    function resetRecords(pairs) {
        if (!Array.isArray(pairs) || !pairs.length) return 0;
        const ledger = _load();
        let n = 0;
        pairs.forEach(p => {
            if (!p || !p.appId || !p.qid) return;
            const k = _key(p.appId, p.qid);
            if (ledger.records[k]) { delete ledger.records[k]; n++; }
        });
        _save(ledger);
        return n;
    }

    window.MathProgress = {
        recordAnswer,
        getRecord,
        isMastered,
        isStruggling,
        tierFor,
        prioritize,
        summary,
        getMissed,
        buildWeakAreaSet,
        buildBalancedSet,
        buildCuratedProgression,
        buildExamSample,
        countAttempted,
        // trap analytics (AN-1)
        recordTrapOutcome,
        getTopTraps,
        getTrapStats,
        mergeTrapStats,
        // cross-topic review draw (MR-4, MR-7)
        dueAcrossApps,
        countDueAcrossApps,
        exportData,
        importData,
        reset,
        resetRecords,
        // exposed for tests / debug only
        _internals: { STORAGE_KEY, SCHEMA_VERSION, MASTERY_THRESHOLD, MASTERY_DECAY_MS,
                      REVIEW_LADDER_DAYS, TRAP_STORAGE_KEY, TRAP_SCHEMA_VERSION,
                      _streak, _dueAt, _isDue }
    };
})();
