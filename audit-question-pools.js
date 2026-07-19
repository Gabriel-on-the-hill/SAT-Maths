#!/usr/bin/env node
// Audit each app's question pool to see how much variety the personalised
// set generators have to draw from. Prints total / by-difficulty /
// by-archetype counts per app and flags any thin buckets.
//
// Run from the repo root:  node audit-question-pools.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APPS = [
    'Linear_Equations_App',
    'Linear_Functions_App',
    'Nonlinear_Functions_App',
    'Systems_and_Expressions_App_v2',
    'Proportionality_App',
    'Statistical_Reasoning_App',
    'Core_Geometry_App',
    'Analytical_Geometry_App',
    'Data_Analysis_Probability_App'
];

// What we consider a "thin" pool — Weak-Area pulls ~10, so if total seen
// pool < 20 you'll exhaust rotation in two clicks.
const THIN_TOTAL = 20;
const THIN_DIFF = 5; // per-difficulty bucket

function loadApp(app) {
    const file = path.join(__dirname, app, 'data', 'questions.js');
    if (!fs.existsSync(file)) return null;
    let code = fs.readFileSync(file, 'utf8');
    // `const`/`let` at script scope don't attach to the sandbox global.
    // Rewrite top-level declarations to `var` so we can introspect them.
    code = code.replace(/^(\s*)(const|let)\s+(QUESTIONS_DATA|PLAYLIST)\b/m, '$1var $3');
    const sandbox = { window: {}, console };
    vm.createContext(sandbox);
    try {
        vm.runInContext(code, sandbox, { timeout: 5000 });
    } catch (e) {
        return { error: e.message };
    }
    const candidates = [
        sandbox.QUESTIONS_DATA,
        sandbox.PLAYLIST,
        sandbox.window.PLAYLIST,
        sandbox.window.QUESTIONS_DATA
    ];
    for (const c of candidates) {
        if (c) return { data: c };
    }
    return { error: 'no recognised data export' };
}

function isQuestion(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (typeof obj.id !== 'string') return false;
    // A question carries at least one of these payload fields.
    return typeof obj.question === 'string'
        || typeof obj.question_image === 'string'
        || typeof obj.prompt === 'string'
        || Array.isArray(obj.options)
        || typeof obj.answer === 'string'
        || typeof obj.correctIndex === 'number';
}

function collectQuestions(node, out) {
    if (!node) return;
    if (Array.isArray(node)) {
        node.forEach(item => collectQuestions(item, out));
        return;
    }
    if (typeof node !== 'object') return;
    if (isQuestion(node)) {
        out.push(node);
        return;
    }
    Object.values(node).forEach(v => collectQuestions(v, out));
}

function diffOf(q) {
    const d = (q.difficulty || '').toString().trim();
    if (d === 'Easy' || d === 'Medium' || d === 'Hard') return d;
    return 'Other';
}

function tally(qs) {
    const byDiff = { Easy: 0, Medium: 0, Hard: 0, Other: 0 };
    const byArch = {};
    let withArchetype = 0;
    qs.forEach(q => {
        byDiff[diffOf(q)]++;
        if (q.archetype) {
            withArchetype++;
            byArch[q.archetype] = (byArch[q.archetype] || 0) + 1;
        }
    });
    return { total: qs.length, byDiff, byArch, withArchetype };
}

function pad(str, len) {
    str = String(str);
    return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

console.log('');
console.log('Edutrack Math — Question Pool Audit');
console.log('====================================');
console.log('');
console.log(pad('App', 36) + pad('Total', 8) + pad('Easy', 7) + pad('Med', 7) + pad('Hard', 7) + pad('Other', 7) + 'Archetypes');
console.log('-'.repeat(95));

const concerns = [];

APPS.forEach(app => {
    const result = loadApp(app);
    if (!result) {
        console.log(pad(app, 36) + '(no data/questions.js found)');
        return;
    }
    if (result.error) {
        console.log(pad(app, 36) + '(error: ' + result.error + ')');
        return;
    }
    const qs = [];
    collectQuestions(result.data, qs);
    const t = tally(qs);
    console.log(
        pad(app, 36) +
        pad(t.total, 8) +
        pad(t.byDiff.Easy, 7) +
        pad(t.byDiff.Medium, 7) +
        pad(t.byDiff.Hard, 7) +
        pad(t.byDiff.Other, 7) +
        Object.keys(t.byArch).length + ' (' + t.withArchetype + ' tagged)'
    );

    if (t.total < THIN_TOTAL) {
        concerns.push(`${app}: only ${t.total} questions total — Weak-Area rotation will repeat fast`);
    }
    const tagged = t.byDiff.Easy + t.byDiff.Medium + t.byDiff.Hard;
    if (tagged === 0 && t.total > 0) {
        concerns.push(`${app}: no difficulty tags — uses concept-based progression instead of Easy/Medium/Hard sets (expected for this app)`);
    } else if (tagged > 0) {
        ['Easy', 'Medium', 'Hard'].forEach(d => {
            if (t.byDiff[d] < THIN_DIFF) {
                concerns.push(`${app}: only ${t.byDiff[d]} ${d} questions — Fresh sets will fall back to recents in this difficulty`);
            }
        });
    }
    if (t.withArchetype < t.total * 0.5) {
        concerns.push(`${app}: ${t.withArchetype}/${t.total} questions have archetype tags — exam-sample distribution may degrade`);
    }
});

console.log('');
if (concerns.length === 0) {
    console.log('All pools look healthy — refresh should rotate well.');
} else {
    console.log('Concerns (pools where refresh may feel thin):');
    concerns.forEach(c => console.log('  - ' + c));
}
console.log('');
