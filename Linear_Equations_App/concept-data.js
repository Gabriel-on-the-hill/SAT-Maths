// Linear Equations in One Variable — concept reference.
window.CONCEPT_DATA = {
    appId: 'Linear_Equations_App',
    appName: 'Linear Equations (One Variable)',
    appIcon: '',
    intro: 'Linear equations are 100% mechanical once you spot the structure. Five patterns cover the bank. Recognise the pattern, run the algorithm, move on.',
    archetypes: [
        {
            id: 'isolate-x',
            title: 'Isolate x — straight-line algebra',
            cuePhrases: ['"solve for x"', '"what is the value of x"', '"if 3x − 8 = 7..."'],
            definition: 'A standard linear equation with x on one side or both. Goal: get x alone.',
            mustDo: [
                'Distribute first (multiply out parentheses).',
                'Combine like terms on each side.',
                'Move variables to one side, constants to the other. Divide by the coefficient.'
            ],
            commonTrap: {
                name: 'Solved for the wrong thing',
                disguise: 'SAT often asks for x − 3 or 2x + 1, not just x. The wrong answer is the value of x they want you to skip the last step.'
            },
            desmos: 'Type the whole equation in row 1 (e.g., `3x - 8 = 7`). Desmos solves for x instantly and shows the value. Then do the extra arithmetic the question asked for.'
        },
        {
            id: 'fractions-and-decimals',
            title: 'Equations with fractions or decimals',
            cuePhrases: ['"4x/5 = 20"', '"0.25x + 1.5 = 4"', 'fractions or decimals mid-equation'],
            definition: 'A linear equation cluttered with fractions, mixed numbers, or decimals.',
            mustDo: [
                'Multiply every term by the lowest common denominator to clear fractions.',
                'For decimals: multiply by 10, 100, or 1000 to make whole numbers.',
                'Then solve normally — isolate x.'
            ],
            commonTrap: {
                name: 'Only multiplied one side',
                disguise: 'Forgetting to multiply the constant on the other side. Every term, both sides, no exceptions.'
            },
            desmos: 'Just type the equation as written — fractions, decimals, all of it. `(4x)/5 = 20` works. Skip the algebra and read x off the result.'
        },
        {
            id: 'variables-both-sides',
            title: 'Variables on both sides',
            cuePhrases: ['"3(2x − 6) − 11 = 4(x − 3) + 6"', 'x appearing left AND right'],
            definition: 'Variable appears on both sides; you have to move it all to one side first.',
            mustDo: [
                'Distribute on both sides first — clear all parentheses.',
                'Pick a side (the one with the larger x-coefficient). Move all x to that side.',
                'Move all constants to the other side. Divide.'
            ],
            commonTrap: {
                name: 'Sign error when moving terms across',
                disguise: 'Subtracting 4x from both sides becomes "2x − 29 = −6" — students sometimes write +6 or +29. Track every sign.'
            },
            desmos: 'Type the full equation. Desmos doesn\'t care how messy. Result is x. Then do whatever post-step the question wants (like x − 3).'
        },
        {
            id: 'no-solution-or-infinite',
            title: 'No solution or infinitely many solutions',
            cuePhrases: ['"the equation has no solution"', '"for what value of k does ... have no solution"', '"infinitely many solutions"'],
            definition: 'A parameter (k, a, c) determines whether the equation has 0, 1, or infinite solutions.',
            mustDo: [
                'Distribute both sides completely.',
                'No solution → coefficients of x match, but constants don\'t (e.g., 3x = 3x + 5).',
                'Infinite solutions → coefficients AND constants both match (3x + 5 = 3x + 5).'
            ],
            commonTrap: {
                name: 'Swapped the two conditions',
                disguise: 'Students confuse "no solution" (same slope, different intercept) with "infinite" (same line). Lines that are parallel never meet → no solution. Identical lines → every x works.'
            },
            desmos: 'Graph both sides as separate functions: `y = (left side)` and `y = (right side)`. Parallel lines → no solution. Identical lines → infinite. One intersection → one solution.'
        },
        {
            id: 'translate-and-solve',
            title: 'Translate words into a linear equation',
            cuePhrases: ['"a number x is..."', '"the sum of two consecutive..."', '"a plumber charges $X plus $Y per hour"'],
            definition: 'A word problem describing a relationship; you write the equation, then solve.',
            mustDo: [
                'Name the unknown explicitly. "Let x = number of hours."',
                'Translate phrase-by-phrase: "is" → =, "plus" → +, "twice" → 2×, "less than" → subtract (watch order).',
                'Solve the equation. Re-read the question — they may want x + 3, not x.'
            ],
            commonTrap: {
                name: 'Misread "less than"',
                disguise: '"5 less than x" means x − 5, NOT 5 − x. The order flips. Same trap for "more than" — read carefully.'
            },
            desmos: 'Once your equation is built, paste it in. Desmos solves. But you can\'t skip the translation step — that\'s where the points live or die.'
        }
    ]
};
