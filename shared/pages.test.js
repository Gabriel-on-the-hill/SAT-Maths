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

console.log('\n' + '-'.repeat(64));
if (failed) {
    console.log(failed + ' PROBLEM(S) FOUND across ' + pages.length + ' pages');
    process.exit(1);
}
console.log('ALL ' + pass + ' PAGES OK');
