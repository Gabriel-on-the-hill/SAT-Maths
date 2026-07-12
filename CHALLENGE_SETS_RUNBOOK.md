# Challenge Sets — Runbook

A Challenge Set is a curated set of hard, multi-concept questions, chosen from
the existing pools and anchored on the archetypes of the questions a student
actually gets wrong. There is **one** Challenge module on the app
(`Challenge_App/`). When a student opens it, it detects who is signed in and
serves that student's own set. One tile on the hub, personal contents by login.

Unlike the nine topic modules, the Challenge module is its **own small app**
(`challenge-app.js` + its own `index.html`), not a clone of a topic module. It
does not run the shared engine. It reuses only three things the app already
provides, and leaves the shared engine and the nine live apps untouched.

---

## 1. How it fits the app you already have

- **The question pools.** Every question in all nine modules is tagged
  `difficulty`, `archetype`, `trapName`, `strategy`, and `timeTarget`. The
  generator reads those tags to select, and stamps each chosen question with its
  source app.
- **The gate.** `shared/gate.js` identifies the signed-in student and exposes it
  via `MathGate.currentName()`. The **roster key is that name, lowercased** — it is
  not a password, and no password belongs in this repo (it is the public site).
- **Progress and mastery.** `challenge-app.js` records every answer through the
  shared `MathProgress` (`shared/progress.js`) — **twice**: once under its own
  `Challenge_App` namespace, which is what it segments on, and once under the
  question's **home app**, so answering here still moves the student's progress in
  the source module and rides the same Sheet sync. Nothing about storage is
  reinvented; only the scoring rules are this module's own (see §2).

Everything else, the drill flow, the four-segment queue, and the on-screen
rendering, lives in `challenge-app.js`. It is small, self-contained, and has its
own answer-checking for multiple-choice and grid-in, so it does not depend on the
shared engine.

## 2. The serving rules — read this before changing `challenge-app.js`

The Challenge set is **low volume** (a couple of dozen questions) and it **churns**:
the tutor adds questions the student missed in Bluebook, and mastered ones retire
for good. That makes it the opposite of Custom Practice, where there is always
more material. Everything below follows from it. `Challenge_App/test-challenge.js`
asserts all of it — **run `node Challenge_App/test-challenge.js` after touching the
module.** If a rule fails, the change is wrong, not the test.

**Three rules, all load-bearing.**

1. **Mastery is two clean correct answers.** Then the question is retired for good.
   There is no time-decay refresher: a re-miss is a better signal than a clock. The
   module counts `rec.correct`, which the ledger keeps as a live credit — plus one
   per correct answer, minus one per miss, floored at zero. So a miss costs a credit
   and drops the question straight back into the to-fix list, wherever it was.
   Never score on `rec.wrong` or on net (`correct - wrong`): those are lifetime
   tallies, and one old miss will then drag a question back in front of the student
   however many times they have since answered it correctly.
2. **The module scores against its own `Challenge_App` ledger, never the home app's.**
   Every challenge question also lives in its home app's pool under the same id, and
   an **exam answer there scores double** — so scoring off the home record let a
   single correct answer in the home module retire a question here before the
   student had ever seen it. `grade()` still writes the home record too, so home
   progress is unaffected; only the *segmenting* read is isolated.
3. **`addedAt` — credit earned before a question was (re)added does not count.**
   Every question carries an `addedAt` stamp. A question re-added after a fresh
   Bluebook miss comes back as **new**, even if the student mastered it in an earlier
   cycle. Without this the re-add is a silent no-op and the module fails at its one
   job. (A question with no stamp — an older data file — is simply not gated.)

**Two phases, and the app says which one it is in.**

- **Drill** serves *new* and *to fix* only. Anything already answered correctly is
  **held back**, and the start screen says so. A question is never served twice in
  one sitting: session length is capped at the number of distinct questions
  available, and an answered question is not requeued.
- When the set has been cleared once, the app announces it — *"Set complete. You
  have answered all N questions correctly at least once"* — and offers a **mastery
  round**, which serves the correct-once backlog plus anything freshly missed. There
  the repeats are the announced point of the exercise.
- **Every repeat is labelled** on the question itself (*"Second look — you missed
  this one before"* / *"Mastery check — answer it correctly again to master it"*), and
  after answering, the student is told where it now stands. A student must never
  wonder why they are seeing a question again.
- An **empty set** is not a completed set. With no questions, the app says the set is
  empty; it must never report "Set complete".

The four segments are computed live: **not attempted**, **wrong** (to fix),
**correct once** (to master), **mastered** (retired). Timed mode sets the clock to
the sum of the selected questions' `timeTarget` values; when it runs out the session
is force-submitted and still logs, **with the student's name** (see §6).

## 3. Build or finalise a student's set

Driven by the `STUDENTS` block at the top of `build_challenge_set.py`.

1. **Seeds from real misses.** `seeds` are archetype substrings from the questions
   the student actually got wrong (case-insensitive, substring match).
2. **Pin exact misses.** Put the exact ids into `force_ids`; they're always
   included, seeds fill the rest with siblings.
3. **Size.** `per_seed` caps per archetype; `target` caps the set.
4. **Run it.** `python3 build_challenge_set.py jeffrey`. This writes
   `Challenge_App/data/jeffrey.js` (each question carrying its source app and an
   `addedAt` stamp), copies its images into `Challenge_App/assets/`, refreshes
   `Challenge_App/data/manifest.js`, and writes `challenge_shortlist_jeffrey.md`.
   It does **not** touch `index.html` or `challenge-app.js`; those are the static
   app shell.

   **Rebuilds are safe, and adding questions is the normal case.** The builder
   reads the student's existing data file and **carries each question's `addedAt`
   forward**, so a question they are part-way through keeps its progress. Only ids
   that are *not* in the current file get a fresh stamp — a genuinely new question,
   or one that was dropped and is now being re-added after another Bluebook miss.
   Those are served as new. The run prints `newly stamped` and `carried over` so you
   can see exactly which. **Never hand-edit `addedAt` to "now" for a question already
   in the set** — that resets the student's progress on it.
5. **Review the shortlist** and cut anything that isn't the intended type, then
   re-run.
6. **Verify.** Run `node Challenge_App/test-challenge.js` (all green), then open
   `Challenge_App/index.html` in a browser, sign in as that student, and click
   through: the tally and count box appear, Begin renders a question with its
   options or a grid-in box, answering shows the verdict plus trap and explanation,
   a correctly-answered question is **not** offered again in the next set, and the
   "Set complete → mastery round" screen appears once the set has been cleared once.
7. **Deploy.** Commit `Challenge_App` and push (see section 7).

## 4. Add a new student

1. Give them a login in `shared/gate.js` (follow the hash note at the top). Add the
   **hash only** — never the plaintext password, not even in a comment.
2. Copy the `jeffrey` block in `STUDENTS` and set `display`, `seeds`, `force_ids`.
   The roster key is derived from `display` (lowercased), so it must match the
   `name` you gave that login in `gate.js`.
3. Run `python3 build_challenge_set.py <key>`. Their `data/<key>.js` is written
   and the manifest is rebuilt to include them automatically.
4. Review, verify signed in as that student, deploy.

## 5. Reuse on another app family

Point `SOURCE_APPS` at the other family's folders and domains. The selection only
needs `difficulty` and `archetype` tags, which the pools carry. `challenge-app.js`
is generic (it reads `window.PLAYLIST` and uses `MathProgress`), so it works for
any family whose pages load a compatible `MathProgress`. The parser already
handles the shapes seen here: it finds the assignment regardless of the variable
name, reads `{...}` and `[...]` roots, and walks nested `questions` wrappers.

## 6. Notes and gotchas

- **Mastery is NOT shared with the home module — deliberately.** Answers are written
  to both ledgers, but the challenge tally is computed from the `Challenge_App`
  ledger under this module's own rules (§2), while the home modules and
  `progress.html` use `MathProgress.isMastered` (net ≥ 2, 21-day decay). The same
  question can therefore read "mastered" in one and not the other. That is the price
  of rule 2, and it is worth paying: without it, home-app history silently retires
  questions the student has never been asked here. The `mastered X/Y` string in the
  tutor Sheet is the challenge module's count.
- **Every session logs the student's name.** `studentName` is resolved when the
  session starts (from the field `gate.js` autofills, then `MathGate`, then the
  gate's `sessionStorage` key) and stored on the session, so a **force-submit on
  timer expiry logs the same name as a normal finish**. If a name is ever missing in
  the Sheet, the app is not the first place to look: check that the Sheet's header
  row has a column named exactly `Student` (the Apps Script appends its own `Student`
  column on the right if not, leaving yours blank), that the Apps Script was
  redeployed as a **New version**, and that the student is not on a cached copy of
  `challenge-app.js`.
- **Text vs image questions.** Most questions are an image; a few are text-only or
  grid-in. `challenge-app.js` renders all three and checks answers for both
  multiple-choice (letter or index) and grid-in (string or numeric equality).
- **Explanation math.** The shell loads KaTeX and the app typesets explanations
  best-effort; if a formula ever shows raw, that's the typeset step, not the data.
- **Assets are copied in, not linked.** Filenames are content-hashed, so
  `Challenge_App/assets/` is self-contained.
- **Non-destructive.** The generator only reads the source modules and writes
  `Challenge_App/data/*`, the manifest, assets, and the shortlist. The only edits
  to existing files are the single hub tile in `index.html` and the
  `!/Challenge_App/` line in `.gitignore`.
- **Orphaned file.** An earlier `Challenge_App/challenge-loader.js` is no longer
  used (the app does its own loading) and can be deleted.

## 7. Deploy

The site is served from the allow-listed root folders on `master`
(`Gabriel-on-the-hill/SAT-Maths`); `github_pages/` and `sync-pages.sh` are not the
live path. `.gitignore` is an allow-list, so `Challenge_App` must stay listed
(`!/Challenge_App/`) or git silently skips it. To publish:

```
git add -f Challenge_App
git commit -m "Update Challenge module"
git push origin master
```

Then give Pages a minute and hard-refresh.
