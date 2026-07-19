# tools/apps-script — the tutor Sheet's Google Apps Script

`Sessions.gs` receives every completed session from `shared/session.js` and writes
the Sessions / Questions tabs, plus the Dashboard and Student Detail reports.

**This folder is the source of truth. The copy running in Google is a deployment of
it.** Edit here, commit, then paste into the Apps Script editor — never the other way
round. The script previously lived only in Google with no version history, and that
is exactly how it drifted out of step with the sheet without anyone noticing.

## Deploying a change

1. Edit `Sessions.gs` here and run `node tools/apps-script/Sessions.test.js`.
2. Google Sheet → **Extensions → Apps Script**.
3. Select all in the editor, paste this file over it, **Save**.
4. Run `setupAll` once (authorise if prompted).
5. **Deploy → Manage deployments →** edit the existing Web app deployment → **New
   version → Deploy.** Skipping this leaves the old code serving `doPost`.

`SHARED_KEY` here must equal `SYNC_KEY` in `shared/session.js`, or every POST is
rejected with `bad key`.

## The bug this file was written to fix

The sheet was created with headers `Student Name` and `App Name`. The schema later
standardised on `Student` and `App`, with `LEGACY_RENAMES` to migrate. But the rename
only fired when the target was **absent**:

```js
if (to && headers.indexOf(to) === -1) { headers[i] = to; }
```

Once an earlier run had appended `Student` at the far right, that condition was false
forever. `Student Name` was never renamed — it froze as a dead column holding the old
rows' names, while every new row wrote into the appended `Student` column.

The symptom: **the student-name column simply stopped filling in.** Nothing errored,
every other column kept working, and rows up to 12 Jul had names while rows from
16 Jul looked anonymous. A page that looks right — the same failure shape this repo
keeps hitting.

Two changes fix it:

- `ensureHeaders_` no longer silently skips a rename it cannot perform. It logs the
  collision and leaves a note on cell A1, so the situation is visible rather than
  invisible. It deliberately does **not** repair anything inside `doPost` — deleting
  a column while a student is mid-sync is not a trade worth making.
- `repairLegacyColumns()` consolidates duplicates that already exist: it merges the
  dead column's values into the canonical one (**filling blanks only**, so live data
  is never overwritten) and then removes the dead column. Idempotent, and available
  from the **Edutrack** menu.

## Tests

```
node tools/apps-script/Sessions.test.js
```

Apps Script cannot run locally, so the handful of `SpreadsheetApp` calls the repair
actually uses are faked and the repair is driven exactly as it would be on the real
sheet. The headline case is the real one: names split across two columns, both eras
recovered, no row left anonymous, and the live value winning any conflict.

This matters more than usual because `repairLegacyColumns_` **deletes a column**. It
only ever deletes one whose values it has just copied elsewhere — and that is a claim
about the tutor's live data, so it is tested rather than asserted.
