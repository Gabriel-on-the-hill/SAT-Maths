/* Challenge_App - self-contained per-student hard-question drill.
   Four segments: notAttempted -> wrong / correctOnce -> mastered.
   An answered question goes to the BACK of its segment, so it never repeats
   immediately. Mastery + persistence reuse window.MathProgress, keyed to each
   question's SOURCE app, so progress links to the home module. The shared
   engine is not touched. */
(function () {
  'use strict';
  var SRC = 'challenge';
  var POOL = [];
  var S = null; // active session

  /* ---------- segment logic (MathProgress-backed) ---------- */
  function segOf(q) {
    var MP = window.MathProgress;
    if (MP && MP.isMastered(q.app, q.id)) return 'mastered';
    var r = (MP ? MP.getRecord(q.app, q.id) : { attempts: 0, wrong: 0 });
    if (!r || !r.attempts) return 'notAttempted';
    if ((r.wrong || 0) > 0) return 'wrong';
    return 'correctOnce';
  }
  function counts(pool) {
    var c = { notAttempted: 0, wrong: 0, correctOnce: 0, mastered: 0, total: pool.length };
    pool.forEach(function (q) { c[segOf(q)]++; });
    return c;
  }
  var SERVE = ['wrong', 'notAttempted', 'correctOnce'];
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function servable(pool, includeMastered) {
    var order = includeMastered ? ['wrong', 'notAttempted', 'correctOnce', 'mastered'] : SERVE;
    var byseg = { wrong: [], notAttempted: [], correctOnce: [], mastered: [] };
    pool.forEach(function (q) { byseg[segOf(q)].push(q); });
    var out = [];
    order.forEach(function (s) { out = out.concat(shuffle(byseg[s].slice())); });
    return out;
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
    module.exports = { segOf: segOf, counts: counts, servable: servable, correctIndexOf: correctIndexOf, gridCorrect: gridCorrect, estimateSeconds: estimateSeconds, _setPool: function (p) { POOL = p; } };
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
      'not attempted ' + c.notAttempted + ' &middot; to fix ' + c.wrong + ' &middot; correct once ' + c.correctOnce;
  }

  /* ---------- screens ---------- */
  function screenStart(opts) {
    opts = opts || {};
    clear();
    var c = counts(POOL);
    var allMastered = c.mastered === c.total && c.total > 0;
    var allAtLeastOnce = c.notAttempted === 0 && c.wrong === 0 && !allMastered;
    var remaining = c.total - c.mastered;

    root.appendChild(el('h1', { class: 'ttl' }, 'Challenge Set'));
    root.appendChild(el('p', { class: 'tally' }, tallyLine(c)));

    if (allMastered) {
      root.appendChild(el('p', { class: 'msg ok' }, 'You have mastered every question in your set.'));
      var rb = el('button', { class: 'btn' }, 'Reattempt all');
      rb.onclick = function () { begin(parseInt(prompt('How many questions?', Math.min(10, c.total)) || 0, 10), false, true); };
      root.appendChild(rb);
      return;
    }
    if (allAtLeastOnce) {
      root.appendChild(el('p', { class: 'msg' }, 'You have answered every question correctly at least once. Reattempt to turn "correct once" into "mastered".'));
    }

    var box = el('div', { class: 'setup' });
    var lbl = el('label', null, 'How many questions?');
    var count = el('input', { type: 'number', id: 'howMany', min: '1', max: String(c.total), value: String(Math.max(1, Math.min(remaining, 10))) });
    var timedWrap = el('label', { class: 'chk' });
    var timed = el('input', { type: 'checkbox', id: 'timed' });
    timedWrap.appendChild(timed); timedWrap.appendChild(document.createTextNode(' Timed (auto-calculated)'));
    var go = el('button', { class: 'btn' }, 'Begin');
    go.onclick = function () {
      var n = parseInt(count.value, 10) || 1;
      begin(n, timed.checked, false);
    };
    box.appendChild(lbl); box.appendChild(count); box.appendChild(timedWrap); box.appendChild(go);
    root.appendChild(box);
  }

  function begin(n, timed, includeMastered) {
    if (!n || n < 1) return;
    var queue = servable(POOL, includeMastered);
    if (!queue.length) { screenStart(); return; }
    S = { n: n, done: 0, correct: 0, queue: queue, timed: !!timed, endsAt: 0, timerId: 0,
           includeMastered: !!includeMastered, sessionId: 'challenge_' + Date.now(), startedAt: Date.now(), detail: [] };
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

  function nextQuestion() {
    // first servable item whose segment is still servable (mastered dropped unless reattempt-all)
    for (var i = 0; i < S.queue.length; i++) {
      var q = S.queue[i];
      var seg = segOf(q);
      if (S.includeMastered || seg !== 'mastered') { S.queue.splice(i, 1); return q; }
      S.queue.splice(i, 1); i--;
    }
    return null;
  }

  function next() {
    if (S.done >= S.n) return finish('count');
    var q = S.queue.length ? S.queue.shift() : null;
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
    if (window.MathProgress) window.MathProgress.recordAnswer(q.app, q.id, isCorrect, SRC, elapsed);
    S.done++; if (isCorrect) S.correct++;
    S.detail.push({ id: q.id, app: q.app, domain: q.domain || '', difficulty: q.difficulty || '', answered: true, correct: !!isCorrect });
    // requeue: back of its (new) segment, so it returns later, not now
    if (segOf(q) !== 'mastered' || S.includeMastered) S.queue.push(q);
    reveal(q, isCorrect);
  }

  function reveal(q, isCorrect) {
    clear();
    root.appendChild(el('div', { class: 'verdict ' + (isCorrect ? 'ok' : 'no') }, isCorrect ? 'Correct' : 'Not quite'));
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
      var _f = document.getElementById('studentName');
      var nm = (_f && _f.value.trim()) || (window.MathGate && MathGate.currentName && MathGate.currentName()) || '';
      var agg = {};
      S.detail.forEach(function (d) { if (!d.domain) return; var a = agg[d.domain] || (agg[d.domain] = { c: 0, t: 0 }); a.t++; if (d.correct) a.c++; });
      var bd = Object.keys(agg).map(function (k) { return k + ' ' + agg[k].c + '/' + agg[k].t; }).join('; ');
      try {
        MathSession.logCompletion({
          sessionId: S.sessionId, appId: 'Challenge_App',
          appName: 'Challenge Set', module: 'challenge',
          variant: S.includeMastered ? 'reattempt' : 'drill', topicTitle: 'Challenge Set',
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

    var allMastered = c.mastered === c.total && c.total > 0;
    var allAtLeastOnce = c.notAttempted === 0 && c.wrong === 0 && !allMastered;

    if (allMastered) {
      root.appendChild(el('p', { class: 'msg ok' }, 'Every question is mastered.'));
    } else if (allAtLeastOnce) {
      var rb = el('button', { class: 'btn' }, 'Reattempt to master');
      rb.onclick = function () { begin(c.correctOnce, S.timed, false); };
      root.appendChild(rb);
    }
    var back = el('button', { class: 'btn ghost' }, 'Back to start');
    back.onclick = function () { screenStart(); };
    root.appendChild(back);
  }

  /* ---------- boot: wait for login, load the student's set ---------- */
  function keyFor() {
    var n = (window.MathGate && MathGate.currentName && MathGate.currentName()) || '';
    return n.trim().toLowerCase();
  }
  function styleOnce() {
    if (document.getElementById('challenge-css')) return;
    var css = '#challengeRoot{max-width:820px;margin:0 auto;padding:24px;font-family:Outfit,system-ui,sans-serif;color:#0f172a}' +
      '.ttl{font-size:1.5rem;font-weight:800;margin:0 0 8px}.tally{color:#475569;font-size:.95rem;margin:0 0 16px}' +
      '.setup{display:flex;flex-direction:column;gap:12px;max-width:320px}.setup input[type=number]{padding:10px;font-size:1rem;border:1px solid #cbd5e1;border-radius:8px}' +
      '.chk{display:flex;align-items:center;gap:8px}.btn{padding:12px 16px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;font-size:1rem;cursor:pointer}' +
      '.btn.ghost{background:#e2e8f0;color:#0f172a}.btn:hover{filter:brightness(1.05)}.msg{background:#f1f5f9;padding:12px;border-radius:8px}.msg.ok{background:#dcfce7}' +
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
