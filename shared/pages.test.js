/* Page integrity: every page the student can load is complete and parses.

   Run:  node shared/pages.test.js        (exit 0 = all good)
   Needs: npm install     (jsdom)

   WHY THIS FILE EXISTS.

   index.html was committed TRUNCATED, mid-template-literal, in commit 867b227
   ("Custom Practice mode + colorful route-picker hub"). The file simply stopped at

       strip.innerHTML = `

   with no closing backtick, no </script>, no </body>, no </html>. Because an
   unterminated <script> swallows the rest of the document, the hub's ENTIRE inline
   script never ran: the SAT countdown, the settings panel, the per-topic mastery
   strips and the whole-dashboard rollup were all dead on the live site. The page
   still looked fine — the cards are static HTML above the script — so nothing
   announced it, and it stayed that way through several commits and a sync to the
   deploy mirror, which faithfully copied the broken file.

   That is the shape of the failure this repo keeps having: a page that LOOKS right.
   AGENTS.md already says "'I changed the engine and it looks right' is not evidence."
   This file is the cheapest possible evidence for the pages themselves — it does not
   care what they do, only that they are whole and that their JavaScript parses.

   It is deliberately dumb. Dumb is what runs in one second and never needs updating.
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

const ROOT = path.join(__dirname, '..');

// Everything the student's browser can be pointed at.
const ROOT_PAGES = ['index.html', 'progress.html', 'custom.html', 'exam.html', 'review.html'];
const APPS = [
    'Linear_Equations_App',
    'Linear_Functions_App',
    'Nonlinear_Functions_App',
    'Systems_and_Expressions_App_v2',
    'Proportionality_App',
    'Statistical_Reasoning_App',
    'Core_Geometry_App',
    'Analytical_Geometry_App',
    'Data_Analysis_Probability_App',
    'Challenge_App'
];

const pages = ROOT_PAGES.slice();
APPS.forEach(a => {
    ['index.html', 'concept.html'].forEach(f => {
        const p = path.join(a, f);
        if (fs.existsSync(path.join(ROOT, p))) pages.push(p);
    });
});

let pass = 0, failed = 0;
function ok(name, cond) {
    if (cond) { pass++; }
    else { failed++; console.log('  ✗ ' + name); }
    return cond;
}

console.log('Checking ' + pages.length + ' pages are whole and parse\n');

pages.forEach(rel => {
    const full = path.join(ROOT, rel);
    const src = fs.readFileSync(full, 'utf8');
    const problems = [];

    // 1. The document is complete. A truncated file is the exact bug above.
    if (!/<\/html>\s*$/i.test(src)) problems.push('does not end with </html> — file is truncated');
    if (!/<\/body>/i.test(src)) problems.push('no </body>');

    // 2. Every inline script parses. An unterminated string or brace here silently
    //    kills every feature on the page below it.
    const dom = new JSDOM(src, { runScripts: 'outside-only', url: 'https://example.org/' });
    const win = dom.window;
    Array.from(win.document.querySelectorAll('script')).forEach((s, i) => {
        if (s.getAttribute('src')) return;
        const text = s.textContent;
        if (!text.trim()) return;
        try {
            new win.Function(text);
        } catch (e) {
            problems.push('inline script #' + i + ' does not parse: ' + e.message);
        }
    });

    // 3. Every local script it references exists. A 404 script is a dead page.
    Array.from(win.document.querySelectorAll('script[src]')).forEach(s => {
        const ref = s.getAttribute('src');
        if (/^https?:/.test(ref)) return;               // CDN — not ours to check
        const target = path.resolve(path.dirname(full), ref);
        if (!fs.existsSync(target)) problems.push('missing script: ' + ref);
    });

    win.close();

    if (problems.length) {
        console.log('  ✗ ' + rel);
        problems.forEach(p => console.log('      - ' + p));
        failed += problems.length;
    } else {
        pass++;
        console.log('  ✓ ' + rel);
    }
});

/* ── 2 · nothing tutor-facing can reach the public site ───────────────────────
   Pages serves the repo ROOT, so every tracked file is world-readable at a stable
   URL. The .gitignore is an allow-list, and an allow-list only guards the root —
   a LEDGER.md dropped inside shared/ or any *_App/ (folders that ARE published)
   used to ship straight to the internet.

   This matters more every time a student joins. House rule 6: never write an
   assessment of a student into a file the student can read. A ledger says what a
   named minor cannot do yet; a challenge shortlist is a list of what they keep
   getting wrong. Section 5 of .gitignore denies those patterns at any depth, and
   this is what proves the denial still holds. */

const { execSync } = require('child_process');

function isIgnored(p) {
    try {
        execSync('git check-ignore -q ' + JSON.stringify(p), { cwd: ROOT, stdio: 'ignore' });
        return true;                       // exit 0 = ignored
    } catch (e) {
        if (e.status === 1) return false;  // exit 1 = NOT ignored
        return null;                       // git unavailable / not a repo
    }
}

console.log('\nNothing tutor-facing is publishable, at any depth');

// Paths that must never be publishable, in folders that ARE published.
const MUST_BE_IGNORED = [
    'LEDGER.md',
    'shared/LEDGER.md',
    'Linear_Equations_App/LEDGER.md',
    'Challenge_App/data/LEDGER.md',
    'Core_Geometry_App/assets/student_ledger.md',
    'challenge_shortlist_wayne.md',
    'Challenge_App/challenge_shortlist_wayne.md',
    'shared/Class Summaries/week1.md',
    'shared/notes.tutor.md',
    'Challenge_App/roster.tutor.json',
    'shared/Someone_Session_Plan.html'
];

const probe = isIgnored('LEDGER.md');
if (probe === null) {
    console.log('  – skipped: git not available here (the rules are still in .gitignore)');
} else {
    MUST_BE_IGNORED.forEach(p => {
        if (!ok('publishable: ' + p, isIgnored(p) === true)) {
            console.log('      ^ this would be served at a public URL. See .gitignore section 5.');
        }
    });

    // And nothing already tracked may look like tutor material. Catches the case
    // where a file was committed BEFORE the pattern existed — .gitignore does not
    // untrack anything, so the deny rule alone would not save us.
    const TUTOR_SHAPED = /(^|\/)(LEDGER\.md|.*ledger\.md|challenge_shortlist_.*\.md|.*\.tutor\.(md|json))$|Class Summaries\//i;
    const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
    const leaked = tracked.filter(f => TUTOR_SHAPED.test(f));
    if (!ok('no tracked file is tutor-shaped', leaked.length === 0)) {
        leaked.forEach(f => console.log('      ^ tracked and public: ' + f));
    }
    console.log('  (' + tracked.length + ' tracked files scanned)');
}

console.log('\n' + '-'.repeat(64));
if (failed) {
    console.log(failed + ' PROBLEM(S) FOUND');
    process.exit(1);
}
console.log('ALL ' + pass + ' CHECKS OK (' + pages.length + ' pages + publication rules)');
