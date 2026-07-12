/* Challenge_App - self-contained per-student hard-question drill.
   Four segments: notAttempted -> wrong / correctOnce -> mastered.

   This is a LOW-VOLUME set (a couple of dozen questions), so a question the
   student has already answered correctly is never quietly re-served: the drill
   phase hands out new + missed questions only. When the set has been cleared
   once, the app says so and offers an explicit MASTERY ROUND, where the repeats
   are the announced point of the exercise. A question is never served twice
   inside one sitting.

   The set is a churning pool: the tutor adds questions the student missed in
   Bluebook, and mastered ones retire for good (no time-decay refresher -- a
   re-miss is a better signal than a clock). Three rules make that work, and
   they are load-bearing:

     1. MASTERY   two clean correct answers, then the question is retired.
     2. LEDGER    this module scores against its OWN MathProgress namespace,
                  never the home app's, so home-app history cannot retire a
                  question here. grade() still writes the home record too.
     3. addedAt   credit earned before a question was (re)added to the set does
                  not count, so re-adding after a fresh Bluebook miss really does
                  put it back in front of the student.

   build_challenge_set.py stamps addedAt and carries it forward across rebuilds.
   test-challenge.js asserts all of this; run it after touching this file. The
   shared engine is not touched. */
(function () {
  'use strict';
  var SRC = 'challenge';
  var POOL = [];
  var S = null; // active session

  /* ---------- segment logic (MathProgress-backed) ---------- */
  var MASTER_AT = 2;              // two clean correct answers and the question is retired
  var LEDGER = 'Challenge_App';   // this module's OWN credit namespace (see segOf)

  /* Segment on rec.correct, which the shared ledger maintains as a live credit
     counter: +1 for a correct answer, -1 (floored at 0) for a miss. It therefore
     reads as "correct answers standing since the last miss" -- exactly the
     currency this module wants:
        0  -> to fix     (never right, or a miss cancelled the credit)
        1  -> correct once -> held back for the mastery round
        2+ -> mastered   -> retired from the set
     Deliberately NOT rec.wrong or net (correct - wrong): both are lifetime
     tallies, so one old miss would keep dragging a question back into the drill
     however many times the student had since answered it correctly.

     Read against LEDGER, not q.app. Every challenge question also lives in its
     home app's pool under the same id, so scoring off q.app let home-app history
     decide this module's fate -- and since an exam answer scores double, a single
     correct answer over there could retire a question here before the student had
     ever seen it. This module now keeps its own credit; grade() still writes the
     home app's record too, so home progress is unaffected.

     addedAt: a question re-added to the set (student missed it in Bluebook again)
     must start over. Credit earned before it was (re)added does not count. The
     LEDGER record only moves when the question is answered HERE, so lastSeen is
     an exact test. No stamp (older data file) means no gate. */
  function segOf(q) {
    var MP = window.MathProgress;
    var r = (MP && MP.getRecord(LEDGER, q.id)) || { attempts: 0, correct: 0, lastSeen: 0 };
    if (!r.attempts) return 'notAttempted';
    if (q.addedAt && (r.lastSeen || 0) < q.addedAt) return 'notAttempted';
    if ((r.correct || 0) >= MASTER_AT) return 'mastered';
    if ((r.correct || 0) === 0) return 'wrong';
    return 'correctOnce';
  }
  function counts(pool) {
    var c = { notAttempted: 0, wrong: 0, correctOnce: 0, mastered: 0, total: pool.length };
    pool.forEach(function (q) { c[segOf(q)]++; });
    return c;
  }
  /* Which segments each mode will serve, in priority order.
     drill   - the first pass: missed questions first, then unseen. Anything
               already answered correctly is HELD BACK for the mastery round.
     mastery - the second pass, entered deliberately: the correct-once backlog,
               plus anything freshly missed.
     all     - reattempt everything, mastered included. */
  var SERVE_BY_MODE = {
    drill: ['wrong', 'notAttempted'],
    mastery: ['wrong', 'correctOnce'],
    all: ['wrong', 'notAttempted', 'correctOnce', 'mastered']
  };
  function segsFor(mode) { return SERVE_BY_MODE[mode] || SERVE_BY_MODE.drill; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function servable(pool, mode) {
    var byseg = { wrong: [], notAttempted: [], correctOnce: [], mastered: [] };
    pool.forEach(function (q) { byseg[segOf(q)].push(q); });
    var out = [];
    segsFor(mode).forEach(function (s) { out = out.concat(shuffle(byseg[s].slice())); });
    return out;
  }
  function isServable(q, mode) { return segsFor(mode).indexOf(segOf(q)) >= 0; }
  /* how many distinct questions this mode can still offer */
  function availableIn(pool, mode) {
    var c = counts(pool), n = 0;
    segsFor(mode).forEach(function (s) { n += c[s]; });
    return n;
  }

  /* Write an answer to BOTH ledgers, on purpose: LEDGER is what this module
     segments on, and the home app's record keeps the student's progress in their
     home module honest. Source is SRC ('challenge'), never 'exam', so a challenge
     answer is always worth a single credit. */
  function record(q, isCorrect, elapsedMs) {
    var MP = window.MathProgress;
    if (!MP) return;
    MP.recordAnswer(LEDGER, q.id, isCorrect, SRC, elapsedMs);
    MP.recordAnswer(q.app, q.id, isCorrect, SRC, elapsedMs);
  }

  /* ---------- answer checking ---------- */
  function correctIndexOf(q) {
    if (typeof q.correctIndex === 'number') return q.correctIndex;
    if (typeof q.answer === 'string') { var i = 'ABCD'.indexOf(q.answer.trim().toUpperCase()); if (i >= 0) return i; }
    return -1;
  }
  function gridCorrect(q, val) {
    val = String(val == null ? '' : val).trim();
    if (!val) return false;
    var ans = String(q.answer == null ? '' : q.answer).trim();
    if (val === ans) return true;
    var a = parseFloat(val), b = parseFloat(ans);
    return !isNaN(a) && !isNaN(b) && Math.abs(a - b) < 1e-9;
  }
  function estimateSeconds(queue, n) {
    if (!queue.length) return n * 60;
    var s = 0; for (var i = 0; i < n; i++) { s += (parseInt(queue[i % queue.length].timeTarget, 10) || 60); }
    return s;
  }

  /* expose pure logic for headless testing */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { segOf: segOf, counts: counts, servable: servable, isServable: isServable, availableIn: availableIn, record: record, correctIndexOf: correctIndexOf, gridCorrect: gridCorrect, estimateSeconds: estimateSeconds, MASTER_AT: MASTER_AT, LEDGER: LEDGER, _setPool: function (p) { POOL = p; } };
    return;
  }

  /* ---------- DOM helpers ---------- */
  var root;
  function el(tag, attrs, html) { var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function clear() { root.innerHTML = ''; }
  function typeset(node){ if(window.renderMathInElement){ try{ renderMathInElement(node,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],throwOnError:false}); }catch(e){} } }
  function pct(c) { return c.total ? Math.round(c.mastered / c.total * 100) : 0; }
  function tallyLine(c) {
    return 'Mastered <b>' + c.mastered + '</b> of <b>' + c.total + '</b> (' + pct(c) + '%) &middot; ' +
      'new ' + c.notAttempted + ' &middot; to fix ' + c.wrong + ' &middot; to master ' + c.correctOnce;
  }
  /* What the next drill set holds, and why the rest is being withheld. */
  function drillLine(c) {
    var bits = [];
    if (c.notAttempted) bits.push('<b>' + c.notAttempted + '</b> new');
    if (c.wrong) bits.push('<b>' + c.wrong + '</b> to fix');
    var s = 'Up next: ' + bits.join(' and ') + '.';
    if (c.correctOnce) s += ' The <b>' + c.correctOnce + '</b> you have already answered correctly are held back for the mastery round.';
    return s;
  }
  /* the shared "how many / timed / go" panel */
  function setupBox(max, label, mode) {
    var box = el('div', { class: 'setup' });
    box.appendChild(el('label', null, 'How many questions?'));
    var count = el('input', { type: 'number', id: 'howMany', min: '1', max: String(max), value: String(Math.min(max, 10)) });
    var timedWrap = el('label', { class: 'chk' });
    var timed = el('input', { type: 'checkbox', id: 'timed' });
    timedWrap.appendChild(timed); timedWrap.appendChild(document.createTextNode(' Timed (auto-calculated)'));
    var go = el('button', { class: 'btn' }, label);
    go.onclick = function () { begin(parseInt(count.value, 10) || 1, timed.checked, mode); };
    box.appendChild(count); box.appendChild(timedWrap); box.appendChild(go);
    return box;
  }

  /* ---------- screens ---------- */
  function screenStart() {
    clear();
    var c = counts(POOL);
    var allMastered = c.total > 0 && c.mastered === c.total;
    var firstPassLeft = availableIn(POOL, 'drill'); // new + missed

    root.appendChild(el('h1', { class: 'ttl' }, 'Challenge Set'));

    // An empty set must not read as a finished one: with no questions at all,
    // "nothing left to answer" is not the same as "you have answered them all".
    if (!c.total) {
      root.appendChild(el('p', { class: 'msg' }, 'Your challenge set is empty. No questions have been assigned to it yet &mdash; your tutor will add them.'));
      return;
    }

    root.appendChild(el('p', { class: 'tally' }, tallyLine(c)));

    if (allMastered) {
      root.appendChild(el('p', { class: 'msg ok' }, 'You have mastered every question in your set.'));
      var rb = el('button', { class: 'btn' }, 'Reattempt all');
      rb.onclick = function () { begin(c.total, false, 'all'); };
      root.appendChild(rb);
      return;
    }

    // Set cleared once: every question answered correctly at least once.
    if (firstPassLeft === 0) {
      root.appendChild(el('p', { class: 'msg ok' },
        '<b>Set complete.</b> You have answered all ' + c.total + ' questions correctly at least once.'));
      root.appendChild(el('p', { class: 'msg' },
        'To master a question, answer it correctly one more time. <b>' + c.correctOnce + '</b> to go.'));
      root.appendChild(setupBox(c.correctOnce, 'Start mastery round', 'mastery'));
      return;
    }

    // First pass. Say plainly what will and will not be served.
    root.appendChild(el('p', { class: 'note' }, drillLine(c)));
    root.appendChild(setupBox(firstPassLeft, 'Begin', 'drill'));
  }

  function begin(n, timed, mode) {
    mode = mode || 'drill';
    var queue = servable(POOL, mode);
    if (!queue.length) { screenStart(); return; }
    // Never ask for more than the mode can serve as distinct questions: a
    // sitting must not recycle a question the student just answered.
    n = Math.min(Math.max(1, parseInt(n, 10) || 1), queue.length);
    S = { n: n, done: 0, correct: 0, queue: queue, timed: !!timed, endsAt: 0, timerId: 0,
           mode: mode, sessionId: 'challenge_' + Date.now(), startedAt: Date.now(), detail: [],
           studentName: studentName() };
    if (timed) {
      var secs = estimateSeconds(queue, n);
      S.endsAt = Date.now() + secs * 1000;
      S.timerId = setInterval(tick, 1000);
    }
    next();
  }

  function tick() {
    if (!S || !S.timed) return;
    var left = Math.max(0, Math.round((S.endsAt - Date.now()) / 1000));
    var t = document.getElementById('timer');
    if (t) t.textContent = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
    if (left <= 0) { clearInterval(S.timerId); finish('time'); }
  }

  // Pull the next question, dropping any whose segment has moved out of this
  // mode's remit since the queue was built. A question is taken off the queue
  // when it is served and is never put back, so it cannot recur in this sitting.
  function nextQuestion() {
    while (S.queue.length) {
      var q = S.queue.shift();
      if (isServable(q, S.mode)) return q;
    }
    return null;
  }

  function next() {
    if (S.done >= S.n) return finish('count');
    var q = nextQuestion();
    if (!q) return finish('empty');
    renderQuestion(q);
  }

  function renderQuestion(q) {
    clear();
    var c = counts(POOL);
    var head = el('div', { class: 'qhead' });
    head.appendChild(el('span', null, 'Question ' + (S.done + 1) + ' of ' + S.n));
    head.appendChild(el('span', { class: 'mini' }, 'Mastered ' + c.mastered + '/' + c.total + ' (' + pct(c) + '%)'));
    if (S.timed) head.appendChild(el('span', { id: 'timer', class: 'timer' }, ''));
    root.appendChild(head);

    // If the student has met this question before, say why it is back.
    var why = { wrong: 'Second look &mdash; you missed this one before.',
                correctOnce: 'Mastery check &mdash; answer it correctly again to master it.',
                mastered: 'Review &mdash; you have already mastered this one.' }[segOf(q)];
    if (why) root.appendChild(el('p', { class: 'why' }, why));

    var qbox = el('div', { class: 'qbox' });
    if (q.question_image) qbox.innerHTML = '<img src="' + q.question_image + '" alt="Question" class="full-q-image">';
    else if (q.question) qbox.innerHTML = q.question;
    root.appendChild(qbox); typeset(qbox);

    var started = Date.now();
    var isGrid = (q.type === 'grid-in') || (!q.options && correctIndexOf(q) < 0);
    var answered = false;

    if (isGrid) {
      var inp = el('input', { type: 'text', class: 'grid', placeholder: 'Your answer' });
      var sub = el('button', { class: 'btn' }, 'Submit');
      sub.onclick = function () { if (answered) return; answered = true; grade(q, gridCorrect(q, inp.value), started); };
      root.appendChild(inp); root.appendChild(sub);
    } else {
      var opts = el('div', { class: 'opts' });
      var labels = q.options && q.options.length ? q.options : ['A', 'B', 'C', 'D'];
      var ci = correctIndexOf(q);
      labels.forEach(function (label, idx) {
        var b = el('button', { class: 'opt' }, 'ABCD'[idx] + '. ' + (label === ('ABCD'[idx]) ? '' : label));
        b.onclick = function () { if (answered) return; answered = true; grade(q, idx === ci, started); };
        opts.appendChild(b);
      });
      root.appendChild(opts);
    }
  }

  function grade(q, isCorrect, started) {
    var elapsed = Date.now() - started;
    record(q, isCorrect, elapsed);
    S.done++; if (isCorrect) S.correct++;
    S.detail.push({ id: q.id, app: q.app, domain: q.domain || '', difficulty: q.difficulty || '', answered: true, correct: !!isCorrect });
    // Not requeued: an answered question is done for this sitting. If it still
    // needs work it comes back in the next set, in the segment it now belongs to.
    reveal(q, isCorrect);
  }

  function reveal(q, isCorrect) {
    clear();
    root.appendChild(el('div', { class: 'verdict ' + (isCorrect ? 'ok' : 'no') }, isCorrect ? 'Correct' : 'Not quite'));
    // Tell the student where this question now stands, so a later repeat (or the
    // absence of one) is never a surprise.
    var seg = segOf(q);
    var status = (seg === 'mastered') ? 'Mastered &mdash; retired from your set.'
      : (isCorrect && seg === 'correctOnce') ? 'Answer it correctly once more, in the mastery round, and it is mastered.'
      : (!isCorrect) ? 'This one comes back at the start of your next set.'
      : '';
    if (status) root.appendChild(el('p', { class: 'why' }, status));
    if (q.trapName) root.appendChild(el('p', { class: 'trap' }, '<b>Watch for:</b> ' + q.trapName));
    if (q.strategy) root.appendChild(el('p', { class: 'strat' }, '<b>Approach:</b> ' + q.strategy));
    if (q.explanation) root.appendChild(el('div', { class: 'expl' }, q.explanation));
    var nb = el('button', { class: 'btn' }, S.done >= S.n ? 'Finish' : 'Next');
    nb.onclick = next;
    root.appendChild(nb); typeset(root);
  }

  function finish(reason) {
    if (S && S.timerId) clearInterval(S.timerId);
    clear();
    var c = counts(POOL);
    if (window.MathSession && MathSession.logCompletion) {
      // Resolved when the session began, so a forced submit (timer expiry) logs
      // the same name as a normal finish. Re-resolve only as a backstop.
      var nm = (S && S.studentName) || studentName();
      var agg = {};
      S.detail.forEach(function (d) { if (!d.domain) return; var a = agg[d.domain] || (agg[d.domain] = { c: 0, t: 0 }); a.t++; if (d.correct) a.c++; });
      var bd = Object.keys(agg).map(function (k) { return k + ' ' + agg[k].c + '/' + agg[k].t; }).join('; ');
      try {
        MathSession.logCompletion({
          sessionId: S.sessionId, appId: 'Challenge_App',
          appName: 'Challenge Set', module: 'challenge',
          variant: S.mode === 'all' ? 'reattempt' : S.mode, topicTitle: 'Challenge Set',
          score: S.correct, gradable: S.done, ungraded: 0, missed: S.done - S.correct,
          durationMs: Date.now() - S.startedAt, startedAt: S.startedAt, completedAt: Date.now(),
          studentName: nm,
          domainBreakdown: (bd ? bd + ' \u00b7 ' : '') + 'mastered ' + c.mastered + '/' + c.total,
          detail: S.detail
        });
      } catch (e) {}
    }
    root.appendChild(el('h1', { class: 'ttl' }, 'Session complete'));
    if (reason === 'time') root.appendChild(el('p', { class: 'msg' }, 'Time is up.'));
    root.appendChild(el('p', null, 'You answered <b>' + S.correct + '</b> of <b>' + S.done + '</b> correctly this session.'));
    root.appendChild(el('p', { class: 'tally' }, tallyLine(c)));

    var allMastered = c.total > 0 && c.mastered === c.total;
    var firstPassLeft = availableIn(POOL, 'drill');
    var timed = S.timed;

    if (allMastered) {
      root.appendChild(el('p', { class: 'msg ok' }, 'Every question in your set is mastered.'));
    } else if (firstPassLeft === 0) {
      // Don't congratulate someone who just missed questions. Only a reattempt of
      // a mastered set can land here with misses: a mastered question holds two
      // credits, so one miss drops it to correct-once rather than onto the to-fix
      // list, and the set still counts as cleared.
      if (S.correct === S.done) {
        root.appendChild(el('p', { class: 'msg ok' },
          '<b>Set complete.</b> You have answered all ' + c.total + ' questions correctly at least once.'));
      } else {
        root.appendChild(el('p', { class: 'msg' },
          'The ones you missed are back on your list to master.'));
      }
      root.appendChild(el('p', { class: 'msg' },
        'Answer each of the remaining <b>' + c.correctOnce + '</b> correctly one more time to master them.'));
      var mb = el('button', { class: 'btn' }, S.mode === 'mastery' ? 'Continue mastery round' : 'Start mastery round');
      mb.onclick = function () { begin(Math.min(c.correctOnce, 10), timed, 'mastery'); };
      root.appendChild(mb);
    } else {
      root.appendChild(el('p', { class: 'note' }, drillLine(c)));
      var nx = el('button', { class: 'btn' }, 'Next set');
      nx.onclick = function () { begin(Math.min(firstPassLeft, 10), timed, 'drill'); };
      root.appendChild(nx);
    }
    var back = el('button', { class: 'btn ghost' }, 'Back to start');
    back.onclick = function () { screenStart(); };
    root.appendChild(back);
  }

  /* ---------- boot: wait for login, load the student's set ---------- */
  function keyFor() {
    return studentName().toLowerCase();
  }

  /* Who is sitting the session. Three independent sources, because a session
     that reaches the tutor Sheet without a name is useless:
       1. the #studentName field gate.js autofills on unlock,
       2. MathGate itself,
       3. the sessionStorage key gate.js writes, read directly, in case the
          page is served without gate.js or the field is missing.
     boot() will not start the app until this returns something, so a logged
     session always carries a name. */
  var GATE_NAME_KEY = 'edutrack_math_session_name_v1';
  function studentName() {
    var f = document.getElementById('studentName');
    var v = (f && f.value && f.value.trim()) || '';
    if (!v && window.MathGate && MathGate.currentName) v = (MathGate.currentName() || '').trim();
    if (!v) { try { v = (sessionStorage.getItem(GATE_NAME_KEY) || '').trim(); } catch (e) {} }
    return v;
  }
  function styleOnce() {
    if (document.getElementById('challenge-css')) return;
    var css = '#challengeRoot{max-width:820px;margin:0 auto;padding:24px;font-family:Outfit,system-ui,sans-serif;color:#0f172a}' +
      '.ttl{font-size:1.5rem;font-weight:800;margin:0 0 8px}.tally{color:#475569;font-size:.95rem;margin:0 0 16px}' +
      '.setup{display:flex;flex-direction:column;gap:12px;max-width:320px}.setup input[type=number]{padding:10px;font-size:1rem;border:1px solid #cbd5e1;border-radius:8px}' +
      '.chk{display:flex;align-items:center;gap:8px}.btn{padding:12px 16px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;font-size:1rem;cursor:pointer}' +
      '.btn.ghost{background:#e2e8f0;color:#0f172a}.btn:hover{filter:brightness(1.05)}.msg{background:#f1f5f9;padding:12px;border-radius:8px}.msg.ok{background:#dcfce7}' +
      '.note{color:#475569;font-size:.95rem;margin:0 0 16px}' +
      '.why{display:inline-block;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:6px 10px;border-radius:999px;font-size:.85rem;font-weight:600;margin:0 0 12px}' +
      '.qhead{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#475569;font-size:.9rem;margin-bottom:12px}.timer{font-weight:800;color:#b91c1c}' +
      '.qbox{margin:8px 0 16px}.full-q-image{width:100%;height:auto;display:block;box-sizing:border-box;background:#fff;padding:14px;border:1px solid #e2e8f0;border-radius:12px;box-shadow:inset 0 2px 4px rgba(0,0,0,.05);margin:0 auto}.qbox img{max-width:100%;height:auto}.opts{display:flex;flex-direction:column;gap:10px;max-width:none}' +
      '.opt{text-align:left;padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font-size:1rem;cursor:pointer}.opt:hover{border-color:#2563eb;background:#eff6ff}' +
      '.grid{padding:10px;font-size:1.05rem;border:1px solid #cbd5e1;border-radius:8px;margin-right:8px}' +
      '.verdict{font-weight:800;font-size:1.15rem;margin-bottom:10px}.verdict.ok{color:#15803d}.verdict.no{color:#b91c1c}' +
      '.trap,.strat{background:#fff7ed;padding:10px;border-radius:8px;margin:6px 0}.expl{background:#f8fafc;padding:12px;border-radius:8px;margin:10px 0;font-size:.92rem;line-height:1.5}' +
      '.mini{font-variant-numeric:tabular-nums}';
    var st = el('style', { id: 'challenge-css' }); st.textContent = css; document.head.appendChild(st);
  }
  function boot() {
    root = document.getElementById('challengeRoot');
    if (!root) { root = el('div', { id: 'challengeRoot' }); document.body.appendChild(root); }
    styleOnce();
    var roster = window.CHALLENGE_ROSTER || {};
    var file = roster[keyFor()];
    if (!file) { root.innerHTML = '<p class="msg">No challenge set has been assigned to your account yet.</p>'; return; }
    var sc = document.createElement('script'); sc.src = file;
    sc.onload = function () {
      var raw = (window.PLAYLIST && (window.PLAYLIST.guided || window.PLAYLIST)) || [];
      var seen = {}; POOL = [];
      raw.forEach(function (q) { if (q && q.id && !seen[q.id]) { seen[q.id] = 1; POOL.push(q); } });
      screenStart();
    };
    sc.onerror = function () { root.innerHTML = '<p class="msg">Could not load your set.</p>'; };
    document.body.appendChild(sc);
  }
  function waitUnlock() {
    if (window.MathGate && MathGate.isUnlocked && MathGate.isUnlocked() && keyFor()) boot();
    else setTimeout(waitUnlock, 300);
  }
  if (document.readyState !== 'loading') waitUnlock();
  else document.addEventListener('DOMContentLoaded', waitUnlock);
})();
