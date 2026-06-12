# Edutrack Math

A static, browser-based SAT Math practice suite. Nine topic apps share one
engine and a per-question mastery ledger (missed-first rotation, spaced decay,
exam weighting), with a hub dashboard, password gate, and tutor sync.

## Apps
Linear Equations · Linear Functions · Nonlinear Functions · Systems &
Expressions · Proportionality · Statistical Reasoning · Core Geometry ·
Analytical Geometry · Data Analysis & Probability

## Structure
- `index.html` — hub / launcher (mastery dashboard, ⚙ tutor settings: SAT date + exam timer)
- `progress.html` — session history
- `shared/` — shared engine + modules (`engine.js`, `progress.js`, `session.js`, `gate.js`, `breakdown.js`, `tier-preview.js`)
- `*_App/` — each topic app: `index.html` (sets `window.APP_CONFIG`), `data/questions.js`, `manifest.json`, `assets/`

All nine apps load the single `shared/engine.js`; per-app differences live in `APP_CONFIG`.

## Deploy
Served via GitHub Pages from the repo root. Only the web app is published —
source PDFs, performance reports, and tutor tooling stay local via `.gitignore`.
