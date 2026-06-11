// Nonlinear Functions — concept reference.
window.CONCEPT_DATA = {
    appId: 'Nonlinear_Functions_App',
    appName: 'Nonlinear Functions',
    appIcon: '🎢',
    intro: 'Nonlinear is the SAT\'s favourite hunting ground for the 700→800 jump. Seven patterns cover everything: quadratics, exponentials, polynomials. Name the form first, then move.',
    archetypes: [
        {
            id: 'quadratic-standard-form',
            title: 'Quadratic in standard form (ax² + bx + c)',
            cuePhrases: ['"y = ax² + bx + c"', '"the roots / zeros / x-intercepts of..."', '"solve for x"'],
            definition: 'A quadratic written in standard form. You need its roots, vertex, or some structural feature.',
            mustDo: [
                'Try factoring first: find two numbers that multiply to ac and sum to b.',
                'If it doesn\'t factor cleanly, use the quadratic formula: x = (−b ± √(b² − 4ac)) / 2a.',
                'The discriminant (b² − 4ac) tells you: positive = 2 real roots, zero = 1 root, negative = no real roots.'
            ],
            commonTrap: {
                name: 'Forgot ± in the quadratic formula',
                disguise: 'Wrong answer is one of the two roots, not both. Always check for two solutions unless the discriminant is zero.'
            },
            desmos: 'Type the quadratic as `y = ax² + bx + c`. Click the curve where it crosses the x-axis — those points are your roots. Click the bottom (or top) of the parabola for the vertex.'
        },
        {
            id: 'quadratic-vertex-form',
            title: 'Quadratic in vertex form (a(x − h)² + k)',
            cuePhrases: ['"y = a(x − 3)² + 7"', '"the minimum/maximum value"', '"vertex of the parabola"'],
            definition: 'Quadratic written as a(x − h)² + k. Vertex is (h, k). The form gives you the answer almost for free.',
            mustDo: [
                'Vertex is (h, k). NOTE: x = h, not −h (the minus sign in (x − h) is part of the form).',
                'Sign of a tells direction: positive = opens up, minimum at k. Negative = opens down, maximum at k.',
                'To convert from standard form, complete the square.'
            ],
            commonTrap: {
                name: 'Sign of h flipped',
                disguise: 'Form is (x − h)² so h = 3 means vertex at x = +3. Students often write x = −3. Read the form carefully.'
            },
            desmos: 'Type it as written. The vertex appears at (h, k) — Desmos labels it if you click. Verify by typing `f(h)` and confirming you get k.'
        },
        {
            id: 'quadratic-from-graph',
            title: 'Quadratic from a graph or table',
            cuePhrases: ['"the graph shown"', '"a table of values"', '"which equation models the parabola"'],
            definition: 'A parabola is shown (or a table given) and you need to identify the equation, vertex, or roots.',
            mustDo: [
                'Roots from graph: read where the parabola crosses the x-axis.',
                'Vertex from graph: lowest or highest point of the curve.',
                'From a table: a parabola has constant SECOND differences (the differences of the differences are equal).'
            ],
            commonTrap: {
                name: 'Mistook a steep linear curve for a parabola',
                disguise: 'A table with linearly growing values may look curvy in your head. Check FIRST differences — if constant, it\'s linear, not quadratic.'
            },
            desmos: 'Plot the table points as (x, y) pairs. Then test candidate equations on separate rows. The one that hits all the points is yours.'
        },
        {
            id: 'exponential-growth-decay',
            title: 'Exponential growth or decay',
            cuePhrases: ['"y = a · bˣ"', '"increases / decreases by p% each year"', '"doubles every N years"'],
            definition: 'A function of form y = a · bˣ. Base b > 1 = growth. 0 < b < 1 = decay.',
            mustDo: [
                'a is the initial value (at x = 0). b is the growth factor.',
                'For "increases by p% per period": b = 1 + p/100. For decrease: b = 1 − p/100.',
                '"Doubles every N years" → b = 2^(1/N). "Halves every N" → b = (1/2)^(1/N).'
            ],
            commonTrap: {
                name: 'Used the percent directly as b',
                disguise: '"Increases by 5%" → b = 1.05, NOT b = 0.05. Always add or subtract from 1.'
            },
            desmos: 'Plot `y = a · b^x`. Verify at a known point: at x = 0, y should equal a (the initial value). Drag sliders on a and b if uncertain.'
        },
        {
            id: 'polynomial-zeros-factor',
            title: 'Polynomial zeros / factor theorem',
            cuePhrases: ['"(x − 2) is a factor of..."', '"the zeros of the polynomial"', '"y = (x − a)(x − b)(x − c)"'],
            definition: 'A higher-degree polynomial. You need zeros, factors, or end behaviour.',
            mustDo: [
                'Factor theorem: if (x − r) is a factor, then r is a zero (f(r) = 0).',
                'Zeros from factored form: set each factor to zero.',
                'Number of real zeros ≤ degree of polynomial.'
            ],
            commonTrap: {
                name: 'Sign flipped on the zero',
                disguise: 'Factor (x − 3) → zero at x = +3. Factor (x + 3) → zero at x = −3. Sign of the factor flips for the zero.'
            },
            desmos: 'Type the polynomial. Click where the curve crosses x-axis to see each zero. Or type `f(candidate)` and check if it equals zero.'
        },
        {
            id: 'system-with-nonlinear',
            title: 'System: line meets parabola',
            cuePhrases: ['"the system of equations y = ... and y = ..."', '"the points of intersection"'],
            definition: 'A line and a parabola (or two curves) — solve for their intersection point(s).',
            mustDo: [
                'Set the two expressions equal: ax² + bx + c = mx + k.',
                'Rearrange to one side: ax² + (b − m)x + (c − k) = 0.',
                'Solve the resulting quadratic. 0, 1, or 2 intersection points.'
            ],
            commonTrap: {
                name: 'Solved for x only, not (x, y)',
                disguise: 'The question asks for a coordinate pair. Plug x back into either equation to get y. Both values matter.'
            },
            desmos: 'Plot both equations on separate rows. Click the intersection points — Desmos shows the exact (x, y). Done.'
        },
        {
            id: 'function-transformations',
            title: 'Function transformations (shifts, stretches, reflections)',
            cuePhrases: ['"the graph of y = f(x − 2)"', '"y = −f(x) is the reflection of..."', '"shifted up by 3"'],
            definition: 'Given f(x), describe what f(x − a) + b looks like compared to f(x).',
            mustDo: [
                'f(x − a) shifts RIGHT by a. f(x + a) shifts LEFT by a. (The sign feels backwards — accept it.)',
                'f(x) + b shifts UP by b. f(x) − b shifts DOWN.',
                '−f(x) reflects across the x-axis. f(−x) reflects across the y-axis.'
            ],
            commonTrap: {
                name: 'Confused horizontal shift direction',
                disguise: 'f(x − 2) goes RIGHT 2, not left. The minus in the input always feels wrong. Memorise the rule.'
            },
            desmos: 'Plot f(x) and the transformed version on separate rows. Watch how the curve moves. Verify your rule visually.'
        }
    ]
};
