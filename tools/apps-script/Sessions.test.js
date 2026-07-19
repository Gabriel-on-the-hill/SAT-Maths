/* Test the column-repair logic in Sessions.gs against a fake Sheet.

   Run:  node tools/apps-script/Sessions.test.js       (exit 0 = all good)

   WHY THIS EXISTS.

   repairLegacyColumns_ DELETES a spreadsheet column. It only ever deletes one
   whose values it has just copied elsewhere, but "only ever" is a claim, and a
   claim about the tutor's live data deserves evidence rather than confidence.
   Apps Script cannot be run locally, so the two SpreadsheetApp calls the repair
   actually uses -- getRange().getValues()/setValues() and deleteColumn() -- are
   faked here, and the repair is driven exactly as it would be on the real sheet.

   The scenario reproduced below is the real one from the tutor Sheet: headers
   'Student Name' and 'App Name' left over from the original schema, with the
   canonical 'Student' and 'App' appended at the right by a later run. Rows up
   to 12 Jul had names in the legacy column; rows from 16 Jul had them in the
   new one. The sheet looked like it had stopped recording names.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

/* ── a Sheet just real enough ─────────────────────────────────────────────── */
function FakeSheet(grid) {
    this.grid = grid.map(r => r.slice());       // [0] is the header row
    this.deleted = [];
}
FakeSheet.prototype.getLastRow = function () { return this.grid.length; };
FakeSheet.prototype.getLastColumn = function () {
    return this.grid.reduce((m, r) => Math.max(m, r.length), 0);
};
FakeSheet.prototype.getRange = function (row, col, numRows, numCols) {
    const self = this;
    numRows = numRows || 1; numCols = numCols || 1;
    return {
        getValues: function () {
            const out = [];
            for (let r = 0; r < numRows; r++) {
                const line = [];
                for (let c = 0; c < numCols; c++) {
                    const v = (self.grid[row - 1 + r] || [])[col - 1 + c];
                    line.push(v === undefined ? '' : v);
                }
                out.push(line);
            }
            return out;
        },
        setValues: function (vals) {
            for (let r = 0; r < vals.length; r++) {
                const target = row - 1 + r;
                if (!self.grid[target]) self.grid[target] = [];
                for (let c = 0; c < vals[r].length; c++) self.grid[target][col - 1 + c] = vals[r][c];
            }
            return this;
        },
        setFontWeight: function () { return this; },
        setNote: function () { return this; },
        setNumberFormat: function () { return this; }
    };
};
FakeSheet.prototype.deleteColumn = function (col) {
    this.deleted.push(col);
    this.grid.forEach(r => r.splice(col - 1, 1));
};
FakeSheet.prototype.setFrozenRows = function () {};

/* ── load Sessions.gs, stubbing the globals it touches at load time ───────── */
function loadScript() {
    const src = fs.readFileSync(path.join(__dirname, 'Sessions.gs'), 'utf8');
    const sandbox = {
        Logger: { log: function () {} },
        SpreadsheetApp: { getUi: function () { throw new Error('no UI in tests'); } },
        console: console
    };
    // Sessions.gs is plain ES5 top-level declarations; eval it into this scope
    // and hand back the pieces under test.
    const fn = new Function('Logger', 'SpreadsheetApp',
        src + '\n;return { repairLegacyColumns_, mergeColumnValues_, readHeaders_, ensureHeaders_, LEGACY_RENAMES, SESSION_COLUMNS, EXTRA_COLUMNS };');
    return fn(sandbox.Logger, sandbox.SpreadsheetApp);
}
const S = loadScript();

let pass = 0;
function ok(name, cond) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { console.log('  ✗ ' + name); throw new Error('FAILED: ' + name); }
}
function section(t) { console.log('\n' + t); }

/* ── 1 · the real bug, reproduced and repaired ────────────────────────────── */
section('The dead-column bug: names split across two columns, then consolidated');
{
    // Exactly the shape seen on the tutor Sheet.
    const sheet = new FakeSheet([
        ['Timestamp', 'Student Name', 'App Name', 'Topic', 'Session ID', 'Student', 'App'],
        ['2026-07-12', 'Jeffrey', '', 'challenge', 'challenge_1783860664482', '', ''],
        ['2026-07-12', 'Jeffrey', '', 'challenge', 'challenge_1783861533584', '', ''],
        ['2026-07-16', '', '', 'challenge', 'challenge_1784212372682', 'Jeffrey', 'Challenge Set'],
        ['2026-07-17', '', '', 'challenge', 'challenge_1784294894916', 'Jeffrey', 'Challenge Set'],
        ['2026-07-19', '', '', 'challenge', 'challenge_1784463451460', 'Jeffrey', 'Challenge Set']
    ]);

    const report = S.repairLegacyColumns_(sheet);
    ok('it reports what it did', report.length >= 2);

    const headers = S.readHeaders_(sheet);
    ok('the legacy "Student Name" column is gone', headers.indexOf('Student Name') === -1);
    ok('the legacy "App Name" column is gone', headers.indexOf('App Name') === -1);
    ok('exactly one "Student" column remains',
       headers.filter(h => h === 'Student').length === 1);

    // THE POINT: every row now has its name, whichever era it came from.
    const stu = headers.indexOf('Student');
    const names = sheet.grid.slice(1).map(r => r[stu]);
    ok('the OLD rows kept their names (merged from the dead column)',
       names[0] === 'Jeffrey' && names[1] === 'Jeffrey');
    ok('the NEW rows kept theirs (never overwritten)',
       names[2] === 'Jeffrey' && names[3] === 'Jeffrey' && names[4] === 'Jeffrey');
    ok('no row is left anonymous', names.every(n => n === 'Jeffrey'));

    // Unrelated columns must survive the splice untouched.
    const sid = headers.indexOf('Session ID');
    ok('unrelated columns are not disturbed by the deletion',
       sheet.grid[1][sid] === 'challenge_1783860664482' &&
       sheet.grid[5][sid] === 'challenge_1784463451460');
}

/* ── 2 · it never overwrites live data ────────────────────────────────────── */
section('A conflict is resolved in favour of the live column, never the dead one');
{
    const sheet = new FakeSheet([
        ['Student Name', 'Student'],
        ['StaleName', 'RealName']          // both populated — the target must win
    ]);
    S.repairLegacyColumns_(sheet);
    const headers = S.readHeaders_(sheet);
    ok('the live value is kept', sheet.grid[1][headers.indexOf('Student')] === 'RealName');
    ok('the stale value did not overwrite it', sheet.grid[1].indexOf('StaleName') === -1);
}

/* ── 3 · plain rename when the target does not exist yet ──────────────────── */
section('With no duplicate, a legacy header is simply renamed — no data moves');
{
    const sheet = new FakeSheet([
        ['Timestamp', 'Student Name'],
        ['2026-07-12', 'Jeffrey']
    ]);
    S.repairLegacyColumns_(sheet);
    const headers = S.readHeaders_(sheet);
    ok('the header is renamed in place', headers[1] === 'Student');
    ok('the value is untouched', sheet.grid[1][1] === 'Jeffrey');
    ok('nothing was deleted', sheet.deleted.length === 0);
}

/* ── 4 · idempotent: running it twice changes nothing ─────────────────────── */
section('Running the repair again is a no-op — safe to leave in the menu');
{
    const sheet = new FakeSheet([
        ['Timestamp', 'Student Name', 'Student'],
        ['2026-07-12', 'Jeffrey', ''],
        ['2026-07-16', '', 'Jeffrey']
    ]);
    S.repairLegacyColumns_(sheet);
    const after1 = JSON.stringify(sheet.grid);
    const report2 = S.repairLegacyColumns_(sheet);
    ok('the second run reports nothing to do', report2.length === 0);
    ok('and changes nothing', JSON.stringify(sheet.grid) === after1);
}

/* ── 5 · an empty sheet does not throw ────────────────────────────────────── */
section('Edge cases do not throw');
{
    const empty = new FakeSheet([['Timestamp', 'Student Name', 'Student']]);   // headers only
    S.repairLegacyColumns_(empty);
    ok('headers-only sheet is handled', S.readHeaders_(empty).indexOf('Student Name') === -1);

    const clean = new FakeSheet([['Timestamp', 'Student'], ['2026-07-19', 'Jeffrey']]);
    ok('a sheet with nothing to repair reports nothing',
       S.repairLegacyColumns_(clean).length === 0);
}

/* ── 6 · the guard that started all this ──────────────────────────────────── */
section('ensureHeaders_ no longer hides a collision it cannot fix');
{
    // The OLD code silently skipped here, which is how the column stayed dead
    // for weeks. It must now leave a note rather than say nothing.
    const sheet = new FakeSheet([['Timestamp', 'Student Name', 'Student']]);
    let noted = '';
    const r1 = sheet.getRange(1, 1);
    sheet.getRange = function (row, col, nr, nc) {
        const range = FakeSheet.prototype.getRange.call(this, row, col, nr, nc);
        range.setNote = function (t) { noted = t; return this; };
        return range;
    };
    S.ensureHeaders_(sheet, S.SESSION_COLUMNS.concat(S.EXTRA_COLUMNS), S.LEGACY_RENAMES);
    ok('the collision is flagged on the sheet, not swallowed',
       /Duplicate legacy columns/.test(noted) && /Student/.test(noted));
    ok('and it names the repair to run', /Repair legacy columns/.test(noted));
}

console.log('\n' + '-'.repeat(64));
console.log('ALL ' + pass + ' ASSERTIONS PASSED');
