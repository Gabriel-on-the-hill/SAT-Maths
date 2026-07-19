# _archive — retired, kept for the record

Nothing in here is part of the live app. The rule for this repo is **publish what
works**; anything that stopped working, was superseded, or was never wired up lands
here instead of being deleted, so the decision stays reviewable.

Nothing here is linked from the hub, and nothing here is loaded by any page that is.

**This file is the only thing in `_archive/` that is published.** The retired code
beneath it is deliberately untracked — the live site should not serve code that does
not work. What is worth keeping is the *record*: what was retired, why, and which
mistake it represents. That is what you are reading, and it is why it ships.

So: if you retire something, add a section here. The code can stay local; the reason
must not.

**If you are looking for how the app works, you are in the wrong folder.** Go up one
level: [../AGENTS.md](../AGENTS.md).

---

## `Challenge_Jeffrey_App/`

A per-student fork of the Challenge module, from before the module learned to hold
more than one student.

**Superseded by** `Challenge_App/`, which keys students at runtime through
`data/manifest.js` (`window.CHALLENGE_ROSTER`, mapping a roster key to that student's
question set). Adding a student is a roster entry now, not a folder — see
[../CHALLENGE_SETS_RUNBOOK.md](../CHALLENGE_SETS_RUNBOOK.md).

It was never published (never in the `.gitignore` allow-list) and nothing links to
it, so retiring it changes nothing for any student.

**Do not fork the challenge module per student again.** That is the mistake this
folder records.

## `sync-pages.sh`, `sync-to-pages.sh`

The two scripts that maintained the `github_pages/` mirror.

**Retired because the mirror was never the deploy.** GitHub Pages serves the repo
**root** — `.nojekyll` is at the root, and the tracked root files are what students
load. `github_pages/` was never committed on any branch, so nothing ever fetched it.
Running these scripts copied files into a folder no one read.

Two scripts existed for one job: `sync-to-pages.sh` (May) was superseded by
`sync-pages.sh` (July), and both survived.

There is no publish step now. **Edit the root; that is the site.** This also removes
the "stale mirror" failure mode permanently — see the warning below for why that
mattered.

---

## ⚠ `github_pages/` — still at the repo root, and it should not be

**It is not a mirror. It is a second clone of this repository**, and it is the
single most dangerous thing in this project.

    remote:  https://github.com/Gabriel-on-the-hill/SAT-Maths.git   (same repo, push enabled)
    branch:  main
    HEAD:    4db8f21, 31 May 2026
    state:   27 commits behind, DIVERGED from main, with uncommitted edits

A `git commit -a && git push` run from inside that folder — by anyone who wandered in
thinking it was the deploy — would clobber months of work on the real `main`. The
root [CLAUDE.md](../CLAUDE.md) records that "a stale mirror has corrupted this repo
once already". This is that mirror, still loaded.

**It is safe to delete. This was verified, not assumed:**

- All **27** of its commits already exist in the outer repository — it holds **zero**
  unique history (checked with `git cat-file -e` against the outer object store).
- Its working tree is byte-identical to the tracked root files (`diff -rq`), because
  that is all `sync-pages.sh` ever did.
- It has never been committed on any branch of the outer repo, so nothing references
  it.

It could not be moved here automatically — the directory is **locked by another
process** (a file handle held by an editor, a shell sitting in it, or an indexer).
Close anything pointing at it and remove it by hand:

```bash
rm -rf "github_pages"          # or delete it in Explorer
```

Until then it is explicitly gitignored, so it cannot be published or committed.
