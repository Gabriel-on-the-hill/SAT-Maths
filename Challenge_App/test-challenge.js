/* Regression test for the Challenge module's serving rules.
   Run:  node Challenge_App/test-challenge.js       (exit 0 = all good)

   These are the rules the module exists to uphold. If you change challenge-app.js
   and one of these fails, the change is wrong -- not the test. In particular:

     - The set is LOW VOLUME. A student must never be handed back a question they
       just answered correctly, in the same sitting or the next one. That is what
       the drill/mastery split is for.
     - Every challenge question also lives in its home app's pool under the same
       id, and an exam answer there scores DOUBLE. If this module ever scores off
       the home app's record again, home-app history will silently retire
       questions the student has not seen here.
     - The pool churns: the tutor re-adds questions after fresh Bluebook misses.
       A re-added question must come back as new, or the module is pointless.
*/
'use strict';
var assert = require('assert');
var path = require('path');

/* ---- headless browser bits that shared/progress.js needs ---- */
var store = {};
global.localStorage = {
  getItem: function (k) { return k in store ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};
global.window = global;
require(path.join(__dirname, '..', 'shared', 'progress.js'));
var MP = global.MathProgress;
var C = require(path.join(__dirname, 'challenge-app.js'));

function reset() { store = {}; }
var HOME = 'Core_Geometry_App';
function q(id, addedAt) { return { id: id, app: HOME, addedAt: addedAt || 0 }; }
function pool(n, addedAt) { var p = []; for (var i = 1; i <= n; i++) p.push(q('q' + i, addedAt)); return p; }
function answer(question, correct) { C.record(question, correct, 0); }

/* Play one sitting exactly as begin()/next()/grade() do, and report what it
   served. Returns the ids served, in order. */
function sitting(p, mode, want, isCorrect) {
  var queue = C.servable(p, mode);
  var n = Math.min(Math.max(1, want), queue.length);
  var served = [], done = 0;
  while (done < n) {
    var next = null;
    while (queue.length) { var cand = queue.shift(); if (C.isServable(cand, mode)) { next = cand; break; } }
    if (!next) break;
    assert(served.indexOf(next.id) < 0, 'served ' + next.id + ' twice in one sitting');
    answer(next, isCorrect(done, next));
    served.push(next.id); done++;
  }
  return served;
}

var tests = [];
function test(name, fn) { tests.push([name, fn]); }

/* ---------------------------------------------------------------- */

test('a fresh question is new, and the drill serves it', function () {
  reset();
  var p = pool(3);
  assert.strictEqual(C.segOf(p[0]), 'notAttempted');
  assert.strictEqual(C.availableIn(p, 'drill'), 3);
});

test('two clean correct answers master a question, and it retires', function () {
  reset();
  var p = pool(1), x = p[0];
  answer(x, true);
  assert.strictEqual(C.segOf(x), 'correctOnce', 'one correct is not mastery');
  answer(x, true);
  assert.strictEqual(C.segOf(x), 'mastered');
  assert.strictEqual(C.availableIn(p, 'drill'), 0, 'mastered must not be served again');
  assert.strictEqual(C.availableIn(p, 'mastery'), 0);
});

test('a correct answer ALWAYS takes a question out of the drill', function () {
  reset();
  var p = pool(1), x = p[0];
  answer(x, false); answer(x, false);              // missed twice
  assert.strictEqual(C.segOf(x), 'wrong');
  answer(x, true);                                 // now they get it right
  assert.strictEqual(C.segOf(x), 'correctOnce', 'history must not outrank a correct answer');
  assert.strictEqual(C.availableIn(p, 'drill'), 0, 'the drill must not hand it straight back');
});

test('a miss sends a question back to the to-fix list, and it is served first', function () {
  reset();
  var p = pool(5);
  answer(p[4], false);                             // q5 missed
  var order = C.servable(p, 'drill');
  assert.strictEqual(order[0].id, 'q5', 'missed questions lead the next drill');
  assert.strictEqual(C.segOf(p[4]), 'wrong');
});

test('a mastered question that is missed again comes back', function () {
  reset();
  var p = pool(1), x = p[0];
  answer(x, true); answer(x, true);
  assert.strictEqual(C.segOf(x), 'mastered');
  answer(x, false);                                // re-miss (in a reattempt)
  assert.strictEqual(C.segOf(x), 'correctOnce', 'a re-miss costs a credit');
  assert(C.availableIn(p, 'mastery') > 0, 'and it is servable again');
});

test('HOME-APP credit cannot retire a challenge question (ledger isolation)', function () {
  reset();
  var p = pool(1), x = p[0];
  // The same id in the home app: two correct answers, one of them an EXAM answer,
  // which scores double. Under the old scheme this alone retired the question.
  MP.recordAnswer(HOME, x.id, true, 'exam', 0);
  MP.recordAnswer(HOME, x.id, true, 'guided', 0);
  assert(MP.isMastered(HOME, x.id), 'home app considers it mastered');
  assert.strictEqual(C.segOf(x), 'notAttempted', 'but the challenge set has never asked it');
  assert.strictEqual(C.availableIn(p, 'drill'), 1, 'so it must still be served');
});

test('a challenge answer still writes the home app record', function () {
  reset();
  var x = q('q1');
  answer(x, true);
  assert.strictEqual(MP.getRecord(C.LEDGER, 'q1').correct, 1, 'challenge ledger');
  assert.strictEqual(MP.getRecord(HOME, 'q1').correct, 1, 'home ledger too');
});

test('a re-added question starts over, however well it was known before', function () {
  reset();
  var old = q('q1', 1000);
  answer(old, true); answer(old, true);
  assert.strictEqual(C.segOf(old), 'mastered');

  // Tutor re-adds it after a fresh Bluebook miss: same id, newer stamp.
  var readded = q('q1', Date.now() + 1000);
  assert.strictEqual(C.segOf(readded), 'notAttempted', 'credit predating the re-add must not count');
  assert.strictEqual(C.availableIn([readded], 'drill'), 1, 'and it must be served again');
});

test('an unstamped question (older data file) still works', function () {
  reset();
  var x = { id: 'q1', app: HOME };                 // no addedAt at all
  answer(x, true);
  assert.strictEqual(C.segOf(x), 'correctOnce', 'no stamp means no freshness gate');
});

test('an empty set is not a completed set', function () {
  reset();
  var c = C.counts([]);
  assert.strictEqual(c.total, 0);
  assert.strictEqual(C.availableIn([], 'drill'), 0);
  assert.strictEqual(C.availableIn([], 'mastery'), 0);
});

test('full lifecycle: 200 random students all reach 100% mastered, no repeats', function () {
  for (var t = 0; t < 200; t++) {
    reset();
    var p = pool(24, 1000), guard;
    var right = {};                                 // ids standing correct right now

    // Drill phase: never re-serve anything currently answered correctly.
    for (guard = 0; C.availableIn(p, 'drill') > 0 && guard < 300; guard++) {
      sitting(p, 'drill', 10, function (i, question) {
        assert(!right[question.id], question.id + ' re-served in a drill after a correct answer');
        var ok = Math.random() < 0.75;
        if (ok) right[question.id] = 1; else delete right[question.id];
        return ok;
      });
    }
    assert.strictEqual(C.availableIn(p, 'drill'), 0, 'drill must terminate');
    assert.strictEqual(C.counts(p).notAttempted, 0, 'every question answered at least once');

    // Mastery phase.
    for (guard = 0; C.availableIn(p, 'mastery') > 0 && guard < 300; guard++) {
      sitting(p, 'mastery', 10, function () {
        var ok = Math.random() < 0.75;
        return ok;
      });
    }
    assert.strictEqual(C.counts(p).mastered, 24, 'the whole set masters out');
  }
});

test('adding questions mid-flight keeps existing progress and serves only the new ones', function () {
  reset();
  var p = pool(5, 1000);
  p.forEach(function (x) { answer(x, true); answer(x, true); });   // all mastered
  assert.strictEqual(C.counts(p).mastered, 5);

  // Rebuild: the 5 keep their stamps (builder carries them forward), 3 arrive new.
  var grown = p.concat(pool(3, Date.now()).map(function (x, i) { return q('new' + i, Date.now()); }));
  var c = C.counts(grown);
  assert.strictEqual(c.total, 8);
  assert.strictEqual(c.mastered, 5, 'existing progress survives the rebuild');
  assert.strictEqual(c.notAttempted, 3, 'only the additions are new');
  var served = C.servable(grown, 'drill').map(function (x) { return x.id; });
  assert.deepStrictEqual(served.slice().sort(), ['new0', 'new1', 'new2'], 'drill serves only the additions');
});

/* ---------------------------------------------------------------- */

var failed = 0;
tests.forEach(function (t) {
  try { t[1](); console.log('  ok   ' + t[0]); }
  catch (e) { failed++; console.log('  FAIL ' + t[0] + '\n         ' + e.message); }
});
console.log('\n' + (tests.length - failed) + '/' + tests.length + ' passed');
process.exit(failed ? 1 : 0);
