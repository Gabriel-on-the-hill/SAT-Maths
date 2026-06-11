// Systems & Equivalents — concept reference.
window.CONCEPT_DATA = {
    appId: 'Systems_and_Expressions_App_v2',
    appName: 'Systems & Expressions',
    appIcon: '≈',
    intro: 'Systems and equivalent expressions test whether you can manipulate algebra without losing your place. Six patterns. Recognise the form, pick the technique.',
    archetypes: [
        {
            id: 'system-substitution',
            title: 'System by substitution',
            cuePhrases: ['"y = ... and ..."', 'one equation already solved for y or x'],
            definition: 'Two equations, two unknowns. One is already solved for a variable (e.g., y = 3x − 5). Substitute into the other.',
            mustDo: [
                'Substitute the solved expression into the other equation.',
                'Solve the resulting one-variable equation.',
                'Plug back to find the other variable. Answer is (x, y).'
            ],
            commonTrap: {
                name: 'Found one variable, stopped',
                disguise: 'The question asks for (x, y) or x + y. Don\'t stop at x — always compute the other.'
            },
            desmos: 'Plot both equations. The intersection point IS the solution. Click it; Desmos shows (x, y). Skip the algebra entirely if needed.'
        },
        {
            id: 'system-elimination',
            title: 'System by elimination',
            cuePhrases: ['"2x + 3y = 12 and 4x − y = 5"', 'both equations in standard form'],
            definition: 'Two equations, both in standard form (Ax + By = C). Add or subtract to cancel one variable.',
            mustDo: [
                'Match coefficients of one variable. Multiply equations to make them equal (or opposite).',
                'Add or subtract the equations to cancel that variable.',
                'Solve for the remaining variable, then back-substitute.'
            ],
            commonTrap: {
                name: 'Sign error during subtraction',
                disguise: 'Subtracting flips ALL signs in the second equation. Students often forget one. Convert subtraction to "add the opposite" to be safe.'
            },
            desmos: 'Same as substitution — just plot both. Intersection = solution. Algebra is for backup or when Desmos isn\'t available.'
        },
        {
            id: 'number-of-solutions',
            title: 'Number of solutions (0, 1, or infinite)',
            cuePhrases: ['"the system has no solution"', '"for what value of k..."', '"infinitely many solutions"'],
            definition: 'Parameter k controls whether the two lines intersect 0, 1, or infinite times.',
            mustDo: [
                'One solution → different slopes (lines cross).',
                'No solution → same slope, different y-intercepts (parallel lines).',
                'Infinite solutions → same slope AND same y-intercept (identical lines).'
            ],
            commonTrap: {
                name: 'Mixed up "no solution" and "infinite"',
                disguise: 'Both have the same slope. Difference is the y-intercept. Same intercept → infinite. Different → none. Always check both.'
            },
            desmos: 'Plot both equations with k as a slider. Drag k. When the lines coincide → infinite. When parallel and distinct → none. When they cross → one.'
        },
        {
            id: 'equivalent-expressions',
            title: 'Equivalent expressions (factoring / expanding)',
            cuePhrases: ['"which expression is equivalent to..."', '"(x + 3)(x − 2) ="', '"factor completely"'],
            definition: 'Rewrite an expression in a different but equal form. Either factor it or expand it.',
            mustDo: [
                'Expanding: distribute every term in the first bracket to every term in the second (FOIL).',
                'Factoring: find common factors first, then patterns (difference of squares, perfect square, etc.).',
                'Difference of squares: a² − b² = (a − b)(a + b). Memorise.'
            ],
            commonTrap: {
                name: 'Lost a sign or missed a term',
                disguise: '(x + 3)(x − 2) = x² + x − 6. Wrong answers will show x² − x − 6 or x² + 5x − 6. Track every term.'
            },
            desmos: 'Type both sides and check if they match: type the original AND a candidate equivalent on separate rows. If both graphs are identical, they\'re equivalent.'
        },
        {
            id: 'polynomial-division',
            title: 'Polynomial division / synthetic division',
            cuePhrases: ['"(x³ + 2x² − x − 2) ÷ (x − 1)"', '"the remainder when..."', '"P(x) / (x − a)"'],
            definition: 'Divide a polynomial by a linear factor. Get quotient and remainder.',
            mustDo: [
                'For (x − a): use synthetic division. Write coefficients, bring down, multiply by a, add, repeat.',
                'The remainder of P(x) ÷ (x − a) equals P(a) — the remainder theorem.',
                'Zero remainder means (x − a) is a factor of P(x).'
            ],
            commonTrap: {
                name: 'Used wrong sign of a in synthetic division',
                disguise: 'Dividing by (x − 3) means a = +3, not −3. Always use the OPPOSITE sign of the constant in the divisor.'
            },
            desmos: 'Compute P(a) directly: type `P(x) = ...` then `P(a)` in a new row. If you get 0, (x − a) is a factor. Faster than long division.'
        },
        {
            id: 'rewriting-rational-or-radical',
            title: 'Rewriting rational or radical expressions',
            cuePhrases: ['"(x² − 9) / (x − 3) ="', '"√(50) ="', '"simplify the expression"'],
            definition: 'Simplify a fraction with polynomials, or simplify a radical expression.',
            mustDo: [
                'Rational: factor numerator and denominator. Cancel common factors.',
                'Watch for restrictions: if you cancel (x − 3), note that x ≠ 3 still holds.',
                'Radical: pull out perfect squares. √50 = √(25·2) = 5√2.'
            ],
            commonTrap: {
                name: 'Cancelled across addition',
                disguise: '(x + 3)/3 is NOT x + 1. You can only cancel factors that multiply the whole numerator or denominator — never split a sum.'
            },
            desmos: 'For rational expressions, plot original and simplified versions on separate rows. Identical graphs (except possibly a "hole" at a restricted x) = equivalent.'
        }
    ]
};
