/* Regression test for the mastery ledger's review ladder and tier order.
   Run:  node shared/progress.test.js       (exit 0 = all good)

   TWO THINGS THIS FILE EXISTS TO PROTECT.

   1. THE TIER ORDER: wrong -> learning -> unseen -> mastered.

      When a question's ladder rung elapses, isMastered() goes false and tierFor()
      drops it to 'learning' -- which prioritize() serves AHEAD of 'unseen'. That is
      the ONLY reason a learned question ever comes back.

      The sister R&W app had this inverted: its lapsed questions fell into a tier
      BEHIND 'unseen', and with hundreds of questions in the bank and six to a set,
      'unseen' never ran out -- so a question the student had learned was never drawn
      again, for months, and the decay only ever changed a label on a progress screen.
      If someone "tidies" prioritize() here so mastered/lapsed items sort to the back,
      they will have re-created that bug. This test is what stops them.

   2. THE LADDER: 1 -> 3 -> 7 -> 21 -> 42 days, one rung per consecutive correct.

      The old code used a flat 21-day decay, which treated a question answered right
      twice exactly like one answered right nine times. The ladder spends the
      student's time on the shaky ones and leaves the solid ones alone.

   Note every record below is written with an AGED lastSeen. That is the only way to
   see any of this: in a test that just answered a question, nothing is due.
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
require(path.join(__dirname, 'progress.js'));
var MP = global.MathProgress;
var KEY = MP._internals.STORAGE_KEY;

var APP = 'Core_Geometry_App';
var DAY = 86400000;
function reset() { store = {}; }
function ago(d) { return Date.now() - d * DAY; }

/* Write a ledger record directly, with an aged lastSeen. */
function seed(qid, rec) {
  var led = { version: MP._internals.SCHEMA_VERSION, records: {} };
  try { led = JSON.parse(store[KEY]); } catch (e) {}
  if (!led.records) led = { version: MP._internals.SCHEMA_VERSION, records: {} };
  led.records[APP + ':' + qid] = rec;
  store[KEY] = JSON.stringify(led);
}
function q(id) { return { id: id }; }

var pass = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { console.log('  ✗ ' + name); throw new Error('FAILED: ' + name); }
}
function section(t) { console.log('\n' + t); }

/* ── 1 · the rungs ────────────────────────────────────────────────────────── */
section('The ladder: each consecutive correct pushes the next sighting further out');
[
  // streak, days ago, due?, why
  [1,  2,  true,  'one correct, 2 days ago — the 1-day rung has passed'],
  [2,  2,  false, 'two corrects, 2 days ago — the 3-day rung has NOT passed'],
  [2,  5,  true,  'two corrects, 5 days ago — the 3-day rung has passed'],
  [3,  5,  false, 'three corrects, 5 days ago — the 7-day rung has NOT passed'],
  [3, 10,  true,  'three corrects, 10 days ago — the 7-day rung has passed'],
  [4, 10,  false, 'four corrects, 10 days ago — the 21-day rung has NOT passed'],
  [4, 25,  true,  'four corrects, 25 days ago — the 21-day rung has passed'],
  [5, 30,  false, 'five corrects, 30 days ago — the 42-day rung has NOT passed'],
  [5, 50,  true,  'five corrects, 50 days ago — the 42-day rung has passed'],
  [9, 50,  true,  'the ladder tops out at 42 days; it does not run off the end']
].forEach(function (c) {
  reset();
  var rec = { correct: Math.max(2, c[0]), wrong: 0, attempts: c[0], totalTimeMs: 0,
              lastSeen: ago(c[1]), lastSource: 'practice', streak: c[0] };
  seed('x', rec);
  ok(c[3], MP._internals._isDue(MP.getRecord(APP, 'x')) === c[2]);
});

/* ── 2 · THE REGRESSION: a lapsed question comes back AHEAD of unseen ────── */
section('The tier order: a learned question that lapses is served BEFORE unseen ones');
{
  reset();
  // Mastered (net 2, no wrongs), last seen 40 days ago. Its 3-day rung is long gone.
  seed('learned', { correct: 2, wrong: 0, attempts: 2, totalTimeMs: 0,
                    lastSeen: ago(40), lastSource: 'practice', streak: 2 });

  ok('its mastery has lapsed',            MP.isMastered(APP, 'learned') === false);
  ok('and it is not counted as struggling', MP.isStruggling(APP, 'learned') === false);
  ok('so it lands in the "learning" tier', MP.tierFor(APP, 'learned') === 'learning');

  // Now put it in a pool with questions the student has never seen.
  var ordered = MP.prioritize(APP, [q('unseen1'), q('unseen2'), q('learned'), q('unseen3')]);
  ok('and prioritize() serves it FIRST, ahead of every unseen question',
     ordered[0].id === 'learned');
}

/* ── 3 · a solid question is left alone ──────────────────────────────────── */
section('A question answered right five times is not dragged back every 3 weeks');
{
  reset();
  seed('solid', { correct: 5, wrong: 0, attempts: 5, totalTimeMs: 0,
                  lastSeen: ago(30), lastSource: 'practice', streak: 5 });
  ok('30 days on, a 5-rung question is still mastered (42-day rung)',
     MP.isMastered(APP, 'solid') === true);
  ok('and it sorts to the BACK, behind unseen',
     MP.prioritize(APP, [q('solid'), q('fresh')])[1].id === 'solid');
  // Under the old flat 21-day decay this question would already have lapsed.
}

/* ── 4 · recordAnswer climbs exactly one rung ────────────────────────────── */
section('recordAnswer: one correct is one rung, and a miss drops to the bottom');
{
  reset();
  MP.recordAnswer(APP, 'a', true, 'practice', 0);
  ok('first correct → streak 1',  MP.getRecord(APP, 'a').streak === 1);
  MP.recordAnswer(APP, 'a', true, 'practice', 0);
  ok('second correct → streak 2', MP.getRecord(APP, 'a').streak === 2);
  MP.recordAnswer(APP, 'a', true, 'practice', 0);
  ok('third correct → streak 3',  MP.getRecord(APP, 'a').streak === 3);
  MP.recordAnswer(APP, 'a', false, 'practice', 0);
  ok('a miss → streak 0',         MP.getRecord(APP, 'a').streak === 0);
  ok('and the miss is recorded',      MP.getRecord(APP, 'a').wrong === 1);

  // An exam answer is worth 2 correct, but it is still ONE right answer: one rung.
  reset();
  MP.recordAnswer(APP, 'b', true, 'exam', 0);
  ok('an exam correct scores 2 but climbs only 1 rung',
     MP.getRecord(APP, 'b').correct === 2 && MP.getRecord(APP, 'b').streak === 1);
}

/* ── 5 · ledgers written before the ladder are not reset to zero ─────────── */
section('Pre-ladder ledgers keep the credit they earned');
{
  reset();
  // A real record from before `streak` was stored: no streak field at all.
  seed('old', { correct: 3, wrong: 1, attempts: 4, totalTimeMs: 0,
                lastSeen: ago(5), lastSource: 'practice' });
  ok('its rung is inferred from net-correct, not treated as never-learned',
     MP._internals._streak(MP.getRecord(APP, 'old')) === 2);
  ok('so it sits on the 3-day rung and is due after 5 days',
     MP._internals._isDue(MP.getRecord(APP, 'old')) === true);

  // And answering it once more climbs from the INFERRED rung, not from zero.
  MP.recordAnswer(APP, 'old', true, 'practice', 0);
  ok('answering it climbs from the inferred rung (2 → 3)',
     MP.getRecord(APP, 'old').streak === 3);
}

console.log('\n' + '-'.repeat(64));
console.log('ALL ' + pass + ' ASSERTIONS PASSED');
