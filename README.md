# Edutrack Math

A static, browser-based SAT Math practice suite. Nine topic apps share one
engine and a per-question mastery ledger (missed-first rotation, spaced decay,
exam weighting), with a hub dashboard, password gate, and tutor sync.

## Apps
Linear Equations · Linear Functions · Nonlinear Functions · Systems &
Expressions · Proportionality · Statistical Reasoning · Core Geometry ·
Analytical Geometry · Data Analysis & Probability

## Structure
- `index.html` — hub / launcher (mastery dashboard, tutor settings: SAT date + exam timer)
- `progress.html` — session history
- `shared/` — shared engine + modules (`engine.js`, `progress.js`, `session.js`, `gate.js`, `breakdown.js`, `tier-preview.js`)
- `*_App/` — each topic app: `index.html` (sets `window.APP_CONFIG`), `data/questions.js`, `manifest.json`, `assets/`

All nine apps load the single `shared/engine.js`; per-app differences live in `APP_CONFIG`.

## Deploy
Served via GitHub Pages from the repo **root** — the tracked files listed above
are what students load, and everything tracked is world-readable. (`github_pages/`
is a local mirror that has never been committed; it is not the deploy.)

Publication is allow-listed in `.gitignore`: source PDFs, performance reports,
per-student ledgers, and class notes stay local, at any depth in the tree. The
challenge-set tooling (`build_challenge_set.py`, `CHALLENGE_SETS_RUNBOOK.md`) **is**
published, so it survives a fresh clone — it holds no credentials, but it does
carry student roster keys. See the note at the foot of `.gitignore`.

## Multiple students
This suite serves several students; the folder it lives in is named after one of
them for historical reasons only. Nothing student-specific belongs in the app
itself — per-student material is keyed at runtime (`shared/gate.js` roster,
`Challenge_App`'s `CHALLENGE_ROSTER`), and tutor-facing notes are never tracked.
