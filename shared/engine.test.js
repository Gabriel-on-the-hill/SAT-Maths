/* The engine harness: boots shared/engine.js against a real app template in jsdom
   and drives it the way a student does — click the module, click through the intro,
   answer the question.

   Run:  node shared/engine.test.js        (exit 0 = all good)
   Needs: npm install     (jsdom — the only dependency this repo has)

   WHY THIS FILE EXISTS.

   Until now there was NO headless harness for the nine apps, which meant "I changed
   the engine and it looks right" was the whole verification story for the one file
   that every app runs. AGENTS.md says so plainly and calls it a known weakness.
   This is the fix, and the point is that the NEXT engine change has somewhere to go:
   add to this rather than eyeballing a browser.

   WHAT IT PROTECTS (PEDAGOGY_ALIGNMENT item 1 — the prediction gate).

   Options used to render WITH the question, so the student read four choices and
   recognised one. That is recognition, and it is the weakest form of practice — it
   feels like mastery while producing little. The gate hides the choices until he
   commits, which forces retrieval: the single technique every student here is taught.

   The gate is worth exactly as much as its guarantees, so each one is asserted here:
     - guided/independent: the options are DISABLED and HIDDEN until he commits
     - exam: NEVER gated — it is the real test, and the real test shows its options
     - grid-in: untouched (typing an answer is already a gate)
     - a refresh does not reopen the gate (gateState rides in the session snapshot)
     - `predicted` means he WROTE a prediction, not that he clicked past the gate

   The harness loads the REAL app index.html, not a mock of it. The template is what
   the engine actually has to work against; a fake one would agree with whatever the
   engine did.
*/
'use strict';

let JSDOM;
try {
    ({ JSDOM } = require('jsdom'));
} catch (e) {
    console.error('\n  jsdom is not installed. Run:  npm install\n');
    process.exit(1);
}

const fs = require('fs');
const path = require('path');

const APP_TEMPLATE = path.join(__dirname, '..', 'Linear_Equations_App', 'index.html');
const APP_ID = 'Test_App';
const SESSION_KEY = `edutrack_math_session_${APP_ID}_v1`;

/* Every outbound request any booted window attempts. See the fetch stub in boot(). */
const POSTS = [];

/* Every window booted, so they can all be shut at the end.
   This is not tidiness. Exam mode starts a real setInterval countdown, and jsdom
   timers hold the Node event loop open: without closing the windows this file hangs
   for the length of the exam clock, then the timer hits zero, finishes the playlist
   and posts a fake session. Closing the window stops the clock. */
const WINDOWS = [];
function closeAll() { WINDOWS.forEach(w => { try { w.close(); } catch (e) {} }); }

/* ── the fake question bank ───────────────────────────────────────────────────
   Small on purpose: this tests the ENGINE, not the bank. The tags are the ones the
   engine reads — archetype, trapName, timeTarget. The module keys match the real
   template's buttons (guided / independent / homework / exam). */
const MC = (id, correctIndex, extra) => Object.assign({
    id, question: `Question ${id}?`,
    options: ['A', 'B', 'C', 'D'], correctIndex,
    explanation: `The answer is ${'ABCD'[correctIndex]}.`,
    difficulty: 'Easy'
}, extra || {});

function makePlaylist() {
    return [{
        id: 'test_topic', title: 'Test Topic', introText: 'Intro.',
        questions: {
            guided: [
                MC('q1', 1, { archetype: 'Arithmetic', trapName: 'Off-by-one', timeTarget: 30 }),
                MC('q2', 3, { archetype: 'Arithmetic', trapName: 'Added not multiplied', timeTarget: 45 })
            ],
            independent: [MC('q3', 2, { archetype: 'Arithmetic', timeTarget: 20 })],
            homework: [MC('q6', 0, { timeTarget: 30 })],
            exam: [MC('q4', 2, { timeTarget: 60 })]
        }
    }];
}

/* A bank whose guided module is a grid-in — the shape the gate must not touch. */
function gridInPlaylist() {
    return [{
        id: 'gridin_topic', title: 'Grid-in Topic', introText: 'Intro.',
        questions: {
            guided: [{
                id: 'g1', type: 'grid-in', question: 'What is $7+1$?',
                answer: '8', explanation: 'It is 8.', timeTarget: 25, difficulty: 'Easy'
            }]
        }
    }];
}

/* ── boot ─────────────────────────────────────────────────────────────────────
   Load the real template WITHOUT running its own <script> tags — they would pull
   KaTeX off a CDN and load the app's real question bank. Then inject the config,
   the fake bank and the shared files by hand, in the same order index.html does. */
function boot(opts) {
    opts = opts || {};
    const dom = new JSDOM(fs.readFileSync(APP_TEMPLATE, 'utf8'), {
        runScripts: 'outside-only',
        url: 'https://example.org/app/',
        pretendToBeVisual: true
    });
    const win = dom.window;

    win.APP_CONFIG = Object.assign({ appId: APP_ID }, opts.config || {});
    win.PLAYLIST = opts.playlist || makePlaylist();
    win.alert = () => {};

    // session.js posts a finished session to the tutor's LIVE Google Sheet, and it
    // fires for real the moment a test drives a playlist to the end. A test run must
    // never put invented sessions into the honest record (root rule 5), so every
    // request is captured here instead of sent, and the count is asserted at the
    // bottom of this file. If you add a test that finishes a session, that assertion
    // is what tells you the stub caught it.
    win.fetch = (url, init) => {
        POSTS.push({ url, init });
        return Promise.resolve({ ok: true, status: 200 });
    };

    win.eval(fs.readFileSync(path.join(__dirname, 'progress.js'), 'utf8'));
    win.eval(fs.readFileSync(path.join(__dirname, 'session.js'), 'utf8'));
    if (opts.seed) opts.seed(win);
    win.eval(fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8'));
    WINDOWS.push(win);
    return win;
}

/* Drive the app to the first question of `moduleKey`, exactly as a student does:
   type a name, pick the module, click through the concept intro. */
function startModule(win, moduleKey, o) {
    o = o || {};
    const doc = win.document;
    doc.getElementById('studentName').value = 'Test Student';
    if (o.exam) doc.getElementById('examModeToggle').checked = true;

    const btn = doc.querySelector(`.module-btn[data-module="${moduleKey}"]`);
    if (!btn) throw new Error(`no module button for "${moduleKey}" in the template`);
    btn.click();
    doc.getElementById('startPracticeBtn').click();
    return doc;
}

const optionButtons = (doc) =>
    Array.from(doc.getElementById('optionsGrid').querySelectorAll('.option-btn'));
const gatePanel = (doc) => doc.querySelector('.predict-gate');
const snapshot = (win) => JSON.parse(win.localStorage.getItem(SESSION_KEY) || '{}');

let pass = 0;
function ok(name, cond) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { console.log('  ✗ ' + name); throw new Error('FAILED: ' + name); }
}
function section(t) { console.log('\n' + t); }

/* ── 1 · guided mode: the options stay shut until he commits ──────────────── */
section('Guided mode: the choices stay shut until the student commits');
{
    const doc = (() => { const w = boot(); return startModule(w, 'guided'); })();

    ok('a "Predict first" panel is rendered', !!gatePanel(doc));
    ok('and it offers the free-text prediction box (guided only)',
       !!doc.getElementById('predict-input'));

    const opts = optionButtons(doc);
    ok('all four options exist', opts.length === 4);
    ok('every option is DISABLED before the reveal', opts.every(b => b.disabled === true));
    // Disabled alone is not enough: a greyed-out option is still READ, and then the
    // retrieval never happened. They must be hidden too.
    ok('every option is HIDDEN before the reveal (recognition only needs sight)',
       opts.every(b => b.classList.contains('opt-gated')));

    doc.getElementById('predict-reveal-btn').click();

    const after = optionButtons(doc);
    ok('after the reveal, every option is enabled', after.every(b => b.disabled === false));
    ok('and every option is visible', after.every(b => !b.classList.contains('opt-gated')));
}

/* ── 2 · independent mode: gated, but one click — no text box ─────────────── */
section('Independent mode: gated too, at one click');
{
    const doc = (() => { const w = boot(); return startModule(w, 'independent'); })();
    ok('the gate is up', !!gatePanel(doc));
    ok('but the free-text box is a guided-mode affordance only',
       !doc.getElementById('predict-input'));
    ok('the options are disabled until the reveal',
       optionButtons(doc).every(b => b.disabled === true));
}

/* ── 3 · THE GUARDRAIL: exam mode is never gated ──────────────────────────── */
section('Exam mode: never gated — it is the real test');
{
    const doc = (() => { const w = boot(); return startModule(w, 'guided', { exam: true }); })();
    ok('no gate panel is rendered', !gatePanel(doc));
    const opts = optionButtons(doc);
    ok('the options are enabled immediately',
       opts.length === 4 && opts.every(b => b.disabled === false));
    ok('and none of them are hidden', opts.every(b => !b.classList.contains('opt-gated')));
}

/* ── 4 · the tutor can turn the gate off ──────────────────────────────────── */
section('The gate is tunable per app and per mode via APP_CONFIG');
{
    const doc = (() => { const w = boot({ config: { predictionGate: false } }); return startModule(w, 'guided'); })();
    ok('predictionGate:false disables it for the whole app', !gatePanel(doc));
    ok('and the options come up enabled', optionButtons(doc).every(b => b.disabled === false));
}
{
    const doc = (() => { const w = boot({ config: { predictionGate: { guided: false } } }); return startModule(w, 'guided'); })();
    ok('predictionGate:{guided:false} disables it for that mode only', !gatePanel(doc));
}
{
    // Homework's default is ON — the tutor opts out, rather than opting in.
    const doc = (() => { const w = boot(); return startModule(w, 'homework'); })();
    ok('homework is gated by default', !!gatePanel(doc));
}

/* ── 5 · a written prediction is kept, and counted as retrieval ───────────── */
section('A written prediction is recorded; clicking past the gate is not');
{
    const win = boot();
    const doc = startModule(win, 'guided');
    doc.getElementById('predict-input').value = '4';
    doc.getElementById('predict-reveal-btn').click();

    ok('the commitment stays on screen to hold against the feedback',
       /Your prediction/.test(doc.getElementById('optionsGrid').textContent));

    optionButtons(doc)[1].click();   // correct
    const rec = win.MathProgress.getRecord(APP_ID, 'q1');
    ok('the answer is recorded', rec.attempts === 1 && rec.correct === 1);
    ok('and it is marked as predicted', rec.predicted === 1);
}
{
    const win = boot();
    const doc = startModule(win, 'guided');
    doc.getElementById('predict-reveal-btn').click();   // reveal WITHOUT typing
    optionButtons(doc)[1].click();

    ok('a bare click past the gate is NOT counted as a prediction',
       !win.MathProgress.getRecord(APP_ID, 'q1').predicted);
    // Otherwise the flag would report thinking that never happened (root rule 5).
}

/* ── 6 · grid-in is untouched ─────────────────────────────────────────────── */
section('Grid-in: already gated by having to type an answer — left alone');
{
    const win = boot({ playlist: gridInPlaylist() });
    const doc = startModule(win, 'guided');
    ok('no prediction panel is added to a grid-in', !gatePanel(doc));
    ok('the grid-in input is present and enabled',
       !!doc.getElementById('grid-in-input') && doc.getElementById('grid-in-input').disabled === false);

    doc.getElementById('grid-in-input').value = '8';
    doc.getElementById('grid-in-submit').click();
    ok('and it still grades', win.MathProgress.getRecord(APP_ID, 'g1').correct === 1);
}

/* ── 7 · a refresh does not reopen the gate ───────────────────────────────── */
section('A gate you can reopen by pressing F5 is not a gate');
{
    const win = boot();
    const doc = startModule(win, 'guided');

    const before = snapshot(win);
    ok('the session snapshot carries the gate state', !!before.state.gateState);
    ok('and the gate is recorded as unrevealed before the click',
       !(before.state.gateState[0] && before.state.gateState[0].revealed));

    doc.getElementById('predict-reveal-btn').click();
    ok('after the reveal the snapshot says so', snapshot(win).state.gateState[0].revealed === true);
}
{
    // The real thing: a fresh page that resumes a saved session must NOT hand over
    // the options for a question he had not revealed.
    const saved = (() => { const w = boot(); startModule(w, 'guided'); return w.localStorage.getItem(SESSION_KEY); })();
    const win = boot({ seed: (w) => w.localStorage.setItem(SESSION_KEY, saved) });
    const doc = win.document;
    ok('the resume banner is offered', !doc.getElementById('resumeBanner').hidden);
    doc.getElementById('resumeBtn').click();
    ok('and the resumed question is still gated', !!gatePanel(doc));
    ok('with its options still disabled', optionButtons(doc).every(b => b.disabled === true));
}

/* ── 7b · THE REGRESSION: a new session starts with its gates shut ────────── */
section('Starting a new set does not inherit the last set\'s revealed gates');
{
    // gateState is keyed by global index, the same as userAnswers. Reset one without
    // the other and gateState[0] = {revealed:true} survives into the next session, so
    // the first question comes up with its options already showing. That is the most
    // ordinary flow in the app — do Guided, then do Independent — and the gate did
    // nothing for it. resetAnswers() is what keeps the two together.
    const win = boot();
    const doc = startModule(win, 'guided');
    doc.getElementById('predict-reveal-btn').click();
    ok('question 0 of the first set is revealed', !doc.querySelector('.predict-gate'));

    // Now start a different module from scratch.
    doc.querySelector('.module-btn[data-module="independent"]').click();
    doc.getElementById('startPracticeBtn').click();

    ok('the new set\'s first question is gated again', !!gatePanel(doc));
    ok('and its options are disabled', optionButtons(doc).every(b => b.disabled === true));
    ok('and hidden', optionButtons(doc).every(b => b.classList.contains('opt-gated')));
}

/* ── 8 · traps are captured, not just shown once ──────────────────────────── */
section('Trap analytics: the wrong answer is kept, not thrown away');
{
    const win = boot();
    const doc = startModule(win, 'guided');
    doc.getElementById('predict-reveal-btn').click();
    optionButtons(doc)[0].click();   // WRONG (correct is index 1)

    const stats = win.MathProgress.getTrapStats();
    ok('the question\'s trap is tallied by name', !!stats['Off-by-one']);
    ok('and the miss is counted',
       stats['Off-by-one'].total === 1 && stats['Off-by-one'].wrong === 1);
    ok('and it carries the archetype as its skill', stats['Off-by-one'].skill === 'Arithmetic');
}

/* ── 9 · the pace note (AS-5: speed comes AFTER competence) ───────────────── */
section('Pacing: never during first acquisition, never as a penalty');
{
    const win = boot();
    const doc = startModule(win, 'guided');
    doc.getElementById('predict-reveal-btn').click();
    optionButtons(doc)[1].click();   // correct
    ok('guided mode shows NO pace note — first acquisition stays untimed',
       !/pace-note/.test(doc.getElementById('explanationText').innerHTML));
}
{
    const win = boot();
    const doc = startModule(win, 'independent');
    doc.getElementById('predict-reveal-btn').click();
    optionButtons(doc)[2].click();   // correct for q3
    ok('independent mode does show one, against the authored timeTarget',
       /pace-note/.test(doc.getElementById('explanationText').innerHTML));
}
{
    const win = boot();
    const doc = startModule(win, 'independent');
    doc.getElementById('predict-reveal-btn').click();
    optionButtons(doc)[0].click();   // WRONG
    ok('a wrong answer gets no pace note — "and you were slow" is noise on top of it',
       !/pace-note/.test(doc.getElementById('explanationText').innerHTML));
}

/* ── 10 · the clock is summed from the authored timeTargets ───────────────── */
section('The exam clock comes from what the questions actually ask for');
{
    // guided is q1 (30s) + q2 (45s) = 75s. It used to be a flat 90s/question = 180s,
    // so a set of quick Easies and a set of grinding Hards got the same clock.
    const win = boot();
    const doc = startModule(win, 'guided', { exam: true });
    ok('the clock is the SUM of the questions\' timeTargets (30 + 45 = 75s)',
       doc.getElementById('timerDisplay').textContent === '01:15');
}
{
    // A question with no timeTarget falls back to the flat rate, so a half-tagged
    // bank still produces a sane clock rather than a wrong one.
    const playlist = [{
        id: 't', title: 'T', introText: 'i',
        questions: { guided: [MC('a', 0, { timeTarget: 30 }), MC('b', 0)] }
    }];
    const win = boot({ playlist });
    const doc = startModule(win, 'guided', { exam: true });
    ok('an untagged question falls back to the flat 90s (30 + 90 = 120s)',
       doc.getElementById('timerDisplay').textContent === '02:00');
}
{
    // The tutor's explicit per-question pace on the hub beats the authored targets —
    // that setting exists to override exactly this.
    const win = boot({ seed: (w) => w.localStorage.setItem('edutrack_timer_per_q', '20') });
    const doc = startModule(win, 'guided', { exam: true });
    ok('a tutor-set pace overrides the authored targets (2 x 20s = 40s)',
       doc.getElementById('timerDisplay').textContent === '00:40');
}

/* ── 11 · the cross-topic review draw, in the real page (MR-4, MR-7) ──────── */
section('Due Review: the draw spans strands, and mixes them');
{
    // Boot review.html itself rather than a stand-in, with two apps' worth of due
    // questions in the ledger, and check what the page actually assembles.
    const DAY = 86400000;
    const aged = (streak, daysAgo) => ({
        correct: 2, wrong: 0, attempts: 2, totalTimeMs: 0,
        lastSeen: Date.now() - daysAgo * DAY, lastSource: 'practice', streak
    });

    const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '..', 'review.html'), 'utf8'), {
        runScripts: 'outside-only', url: 'https://example.org/', pretendToBeVisual: true
    });
    const win = dom.window;
    WINDOWS.push(win);
    win.alert = (m) => { win.__alert = m; };
    win.fetch = (url, init) => { POSTS.push({ url, init }); return Promise.resolve({ ok: true, status: 200 }); };

    // Two topics, three questions each — the shape the real page loads.
    const bank = (ids) => [{
        id: 't', title: 'T', introText: 'i',
        questions: { guided: ids.map((id, i) => MC(id, i % 4, { timeTarget: 30 })) }
    }];
    win.EXAM_POOLS = [
        { appId: 'Linear_Equations_App', domain: 'Algebra', playlist: bank(['le1', 'le2', 'le3']) },
        { appId: 'Core_Geometry_App', domain: 'Geometry and Trigonometry', playlist: bank(['cg1', 'cg2']) }
    ];

    // Seed a ledger: four due (two per app), one not due.
    const records = {
        'Linear_Equations_App:le1': aged(2, 40),   // most overdue
        'Linear_Equations_App:le2': aged(2, 30),
        'Core_Geometry_App:cg1': aged(2, 35),
        'Core_Geometry_App:cg2': aged(2, 20),
        'Linear_Equations_App:le3': aged(5, 2)     // rung has not elapsed
    };
    win.localStorage.setItem('edutrack_math_progress_v1', JSON.stringify({ version: 1, records }));

    // Run the page's OWN config line rather than hand-setting it here — that line is
    // part of what this test is checking.
    const cfgLine = Array.from(win.document.querySelectorAll('script'))
        .map(s => s.textContent).find(t => /APP_CONFIG/.test(t));
    ok('review.html declares its own reviewMode config', !!cfgLine && /reviewMode/.test(cfgLine));
    win.eval(cfgLine);

    win.eval(fs.readFileSync(path.join(__dirname, 'progress.js'), 'utf8'));
    win.eval(fs.readFileSync(path.join(__dirname, 'session.js'), 'utf8'));
    win.eval(fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8'));

    const doc = win.document;
    ok('the page reports how much is due', /4 questions due/.test(doc.getElementById('dueCount').textContent));

    doc.getElementById('studentName').value = 'Test Student';
    doc.getElementById('reviewCount').value = '4';
    doc.getElementById('startDueReviewBtn').click();
    doc.getElementById('startPracticeBtn').click();

    ok('it starts without complaint', !win.__alert);
    ok('the question on screen is one of the due ones',
       /Question (le1|le2|cg1|cg2)\?/.test(doc.getElementById('questionText').textContent));
    ok('and the question NOT due is left out',
       !/Question le3\?/.test(doc.getElementById('questionText').textContent));

    // The whole point: consecutive questions come from DIFFERENT strands. Serving
    // strictly by overdueness would hand him le1, cg1, le2, cg2 grouped by topic.
    const served = [];
    for (let i = 0; i < 4; i++) {
        const m = /Question (\w+)\?/.exec(doc.getElementById('questionText').textContent);
        if (m) served.push(m[1]);
        const gate = doc.getElementById('predict-reveal-btn');
        if (gate) gate.click();
        doc.getElementById('nextSlideBtn').click();
    }
    ok('four due questions were served', served.length === 4);
    ok('and the strands alternate rather than clumping',
       served.map(id => id.slice(0, 2)).join(',') === 'le,cg,le,cg');
    ok('most-overdue-first is kept WITHIN each strand (le1 before le2, cg1 before cg2)',
       served.indexOf('le1') < served.indexOf('le2') && served.indexOf('cg1') < served.indexOf('cg2'));
    ok('and the single most overdue question opens the set', served[0] === 'le1');

    // Review is retrieval practice, not a test: it must not be put on a clock.
    ok('review is untimed', doc.getElementById('timerDisplay').hidden === true);
}

/* ── 12 · the harness does not talk to the tutor's live sheet ─────────────── */
section('The test run itself stays out of the real record');
{
    // session.js holds a live Apps Script URL and posts a finished session to it.
    // Nothing above drives a playlist to completion, so nothing should have tried.
    ok('no session was posted to the tutor sheet during this run', POSTS.length === 0);
}

closeAll();   // stop the exam clocks; see WINDOWS

console.log('\n' + '-'.repeat(64));
console.log('ALL ' + pass + ' ASSERTIONS PASSED');
