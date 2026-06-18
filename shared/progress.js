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
    const MASTERY_DECAY_MS = 21 * 86_400_000; // 21 days

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
            lastSource: null
        };
    }

    // Record a single answer. source affects scoring weight:
    //   exam answers count 2x correct, others 1x.
    // A wrong answer increments wrong and removes 1 from correct (min 0).
    function recordAnswer(appId, qid, isCorrect, source, elapsedMs) {
        if (!appId || !qid) return;
        const ledger = _load();
        const k = _key(appId, qid);
        const rec = ledger.records[k] || _emptyRecord();
        const weight = (source === 'exam') ? 2 : 1;

        rec.attempts += 1;
        rec.totalTimeMs += (typeof elapsedMs === 'number' && elapsedMs >= 0) ? elapsedMs : 0;
        rec.lastSeen = Date.now();
        rec.lastSource = source || 'practice';

        if (isCorrect) {
            rec.correct += weight;
        } else {
            rec.wrong += 1;
            rec.correct = Math.max(0, rec.correct - 1);
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

    // Mastered = net correct >= threshold AND last seen within decay window
    function isMastered(appId, qid) {
        const rec = getRecord(appId, qid);
        if (rec.attempts === 0) return false;
        if (_net(rec) < MASTERY_THRESHOLD) return false;
        if (Date.now() - rec.lastSeen > MASTERY_DECAY_MS) return false;
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
    function exportData() {
        return JSON.stringify(_load(), null, 2);
    }

    // Merge another ledger into this one. Takes max of correct, sum of wrong/attempts/time,
    // and latest lastSeen.
    function importData(jsonString) {
        let incoming;
        try { incoming = JSON.parse(jsonString); } catch { return false; }
        if (!incoming || !incoming.records) return false;
        const current = _load();
        Object.keys(incoming.records).forEach(k => {
            const a = current.records[k] || _emptyRecord();
            const b = incoming.records[k];
            current.records[k] = {
                correct: Math.max(a.correct || 0, b.correct || 0),
                wrong: (a.wrong || 0) + (b.wrong || 0),
                attempts: (a.attempts || 0) + (b.attempts || 0),
                totalTimeMs: (a.totalTimeMs || 0) + (b.totalTimeMs || 0),
                lastSeen: Math.max(a.lastSeen || 0, b.lastSeen || 0),
                lastSource: (b.lastSeen || 0) > (a.lastSeen || 0) ? b.lastSource : a.lastSource
            };
        });
        _save(current);
        return true;
    }

    // Wipe all progress (used by debug page and "Reset progress" UI).
    function reset() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
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
        exportData,
        importData,
        reset,
        resetRecords,
        // exposed for tests / debug only
        _internals: { STORAGE_KEY, SCHEMA_VERSION, MASTERY_THRESHOLD, MASTERY_DECAY_MS }
    };
})();
