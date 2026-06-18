// Linear Functions — concept reference data.
// Written in a tutor's voice. Each archetype is the kind of thing I'd
// say to a student sitting across the table, not a textbook entry.

window.CONCEPT_DATA = {
    appId: 'Linear_Functions_App',
    appName: 'Linear Functions',
    appIcon: '',
    intro: 'Every Linear Functions question on the SAT is one of eight patterns. 800-scorers don\'t solve faster — they recognise the pattern in 5 seconds. Walk through the cards below. For each, ask: could I name this from the first line of a question? When yes, mark it understood.',
    archetypes: [
        {
            id: 'slope-intercept-form',
            title: 'Slope-intercept form (y = mx + b)',
            count: 23,
            cuePhrases: [
                '"the equation y = mx + b"',
                '"identify the slope/y-intercept of the line"',
                '"which equation represents the line that..."'
            ],
            definition: 'You see a linear equation and need to pull out the slope (m) or the y-intercept (b). About a quarter of all Linear Functions questions are this — make it automatic.',
            mustDo: [
                'Rule one: get the equation into y = mx + b form before reading anything off. If it starts as 3x + 2y = 12, solve for y first. If you read m or b before isolating y, you will be wrong about half the time.',
                'Once y is alone: m is the number stuck to x. b is the lonely constant.',
                'When the question gives you slope plus a point, plug the point\'s coordinates in for x and y and solve for the missing b. This is one of the most common SAT setups.'
            ],
            commonTrap: {
                name: 'Confused slope (m) with y-intercept (b)',
                disguise: 'SAT loves this trap. You get the equation in standard form, you read the numbers without rearranging, and you confidently pick the choice where slope and intercept are swapped. The fix is always: isolate y first. No shortcuts.'
            },
            desmos: 'Pop the equation into row 1 exactly as the problem gives it — Desmos will rearrange it for you and draw the line. The slope is how steeply the line climbs (or falls); the y-intercept is where it crosses the y-axis. If the question gives you four candidate equations, plot all four on separate rows and pick the one that matches the description. Don\'t do algebra you don\'t have to.'
        },
        {
            id: 'function-context-interpretation',
            title: 'Interpret slope or intercept in a real-world context',
            count: 21,
            cuePhrases: [
                '"what does the y-intercept represent in this context?"',
                '"the slope of the graph best describes..."',
                '"the value of f(0) represents..."'
            ],
            definition: 'They give you a function modelling something real — a savings account, a cooling temperature, a depreciating value — and ask what the slope or an intercept actually means in that story. Pure pattern matching once you internalise three rules.',
            mustDo: [
                'y-intercept is the starting value. It\'s where x = 0, so it\'s "before anything happened" — the initial amount, the original price, the temperature at time zero.',
                'Slope is the rate. Every time x goes up by 1, y changes by m. So if x is "years" and y is "dollars", the slope is dollars per year.',
                'x-intercept is when something runs out. It\'s where y = 0 — the moment the savings account hits zero, the moment the candle burns out, the moment the car\'s value reaches nothing.'
            ],
            commonTrap: {
                name: 'Confused rate of change with initial value',
                disguise: 'The most common SAT swap: the question asks for the starting amount, and the wrong answer describes the rate of change. Or vice versa. Or it asks for when something stops (x-intercept) and the wrong choice describes the starting value (y-intercept). Slow down on the question stem — what are they actually asking for?'
            },
            desmos: 'Type the function into Desmos. Click the point where the line crosses the y-axis — that\'s the starting value, labeled (0, b). Click where it crosses the x-axis — that\'s when the quantity runs out. To see the rate, hover at x = 1 and compare to the starting value; the difference is the slope per unit. You can read all three quantities off the graph in five seconds without doing any algebra.'
        },
        {
            id: 'linear-inequality-context',
            title: 'Translate a word problem into an inequality',
            count: 18,
            cuePhrases: [
                '"at most" / "at least" / "no more than"',
                '"the total ... must not exceed"',
                '"which inequality represents this situation"'
            ],
            definition: 'A word problem describes a constraint and you have to translate it into an inequality. The math is trivial; the trap is the direction of the symbol.',
            mustDo: [
                'Build the expression first — the cost, the weight, the count. Worry about the ≤ or ≥ symbol last.',
                'Learn the four phrase-to-symbol translations cold: "at most" → ≤, "at least" → ≥, "exceeds" or "more than" → >, "less than" → <.',
                'Watch for compound problems. "At least 10 packages AND total weight at most 1100 lbs" gives you TWO inequalities — a system, not one.'
            ],
            commonTrap: {
                name: 'Wrong direction or wrong side of the comparison',
                disguise: 'The four answer choices are usually identical except the inequality direction or which side the variable lives on. The SAT writer is testing one thing: did you translate "at most" correctly. Read the phrase twice before picking the symbol.'
            },
            desmos: 'After you\'ve written your inequality, paste it into Desmos. It shades the half-plane that satisfies it. If the problem says "savings must be at least $500" and your shaded region is the area below $500, you have the inequality backwards. This catch takes 5 seconds and saves you a wrong answer.'
        },
        {
            id: 'linear-modeling-build',
            title: 'Build a linear function from a word problem',
            count: 10,
            cuePhrases: [
                '"a fee of $X plus $Y per [unit]"',
                '"the total cost f(n) is..."',
                '"which function models..."'
            ],
            definition: 'A word problem describes a real situation (cost, distance, growth) and you have to write the linear function that models it. The template is always the same — once you see it, you can\'t unsee it.',
            mustDo: [
                'Memorise the template: Total = (rate per unit) × (number of units) + (fixed amount). Every modelling problem fits this.',
                'Identify the rate (the per-something number) and the fixed amount (the flat fee, the starting value) BEFORE you write anything down. If you can\'t name them, you don\'t understand the problem yet.',
                'Tiered pricing breaks the template. "First 10 at $5, additional at $3" is NOT one linear function — it\'s a piecewise expression. Treat it as two parts: (5 × 10) + (3 × extras).'
            ],
            commonTrap: {
                name: 'Mixed up which number is the rate vs. the fixed amount',
                disguise: 'A wrong answer multiplies the fixed fee by x (turning your one-time charge into a per-unit charge) or drops the rate entirely. Tiered-pricing questions cause the most carnage here — students try to force them into one slope.'
            },
            desmos: 'Once you\'ve written your function, sanity-check it. Type `f(value)` in a new row where "value" is a number from the problem (e.g., if the problem says "after 5 hours she\'s saved $80", type `f(5)`). If Desmos gives you back 80, your function is right. If it gives you 75 or 85, your function is wrong — fix it before you ever look at the answer choices.'
        },
        {
            id: 'solve-linear-inequality',
            title: 'Solve a one-variable linear inequality',
            count: 10,
            cuePhrases: [
                '"solve for x: ax + b > cx + d"',
                '"which value of x satisfies..."',
                '"all values of x such that..."'
            ],
            definition: 'Algebra, with one twist: when you divide by a negative, you flip the inequality sign. Miss that flip and you get the right number with the wrong direction — which is always one of the wrong answer choices waiting for you.',
            mustDo: [
                'Treat it like an equation: distribute, combine like terms, get x by itself.',
                'The one critical rule: whenever you multiply or divide BOTH sides by a negative number, the inequality flips. ≤ becomes ≥. > becomes <. No exceptions.',
                'After you finish, test your answer by plugging in a number that should satisfy it. If the original inequality holds, you\'re right. If it doesn\'t, you probably forgot a flip.'
            ],
            commonTrap: {
                name: 'Forgot to flip when dividing by a negative',
                disguise: 'The wrong answer has the same magnitude as the right one but the opposite inequality direction. Same number, wrong arrow. The SAT writes this trap because students rush past the flip step. Every time you divide by a negative: stop, flip, move on.'
            },
            desmos: 'Type the left side as `y = ...` in row 1 and the right side as `y = ...` in row 2. The two lines will cross at the boundary value (where they\'re equal). The inequality\'s solution is wherever one line is above (or below) the other — you can literally see which side of the boundary contains the solution. This is the fastest way to catch sign-flip mistakes.'
        },
        {
            id: 'slope-from-two-points',
            title: 'Slope from two points or table',
            count: 5,
            cuePhrases: [
                '"a line passes through (a, b) and (c, d)"',
                '"the table below shows values of f(x)"',
                '"what is the slope of the line"'
            ],
            definition: 'Two points (or two rows of a table), one slope to compute. The formula is third-grade arithmetic; the trap is which number goes on top.',
            mustDo: [
                'Label your points explicitly before you compute. Write down "(x₁, y₁) = (3, 7)" and "(x₂, y₂) = (5, 11)". Skipping this step is where 80% of the errors happen.',
                'Slope = (y₂ − y₁) / (x₂ − x₁). The y-differences go on TOP. Rise over run, not run over rise.',
                'Check signs on both deltas before dividing. If the function is decreasing — y goes down as x goes up — the slope is negative.'
            ],
            commonTrap: {
                name: 'Reversed rise/run (the reciprocal)',
                disguise: 'The SAT will plant the reciprocal of the correct slope in the answer choices. If the real slope is 2/3, the wrong choice will be 3/2. This trap catches anyone who computes Δx/Δy by accident. Always double-check: is the difference in y on top?'
            },
            desmos: 'Type both points into Desmos as `(x1, y1)` and `(x2, y2)`. Then type `y = ax + b` and add sliders for a and b. Drag the sliders until the line passes through both points — the value of `a` is your slope. Or skip the slider trick and just visually estimate the slope from the plotted points. For SAT speed: once you\'ve done this twice, you\'ll be able to do it in your head.'
        },
        {
            id: 'inequality-system-or-solution-test',
            title: 'System of inequalities or testing a candidate solution',
            count: 5,
            cuePhrases: [
                '"which point is a solution to the system"',
                '"a point in the shaded region"',
                '"satisfies both inequalities"'
            ],
            definition: 'You have a system (two or more inequalities) and need to find or verify a point that satisfies ALL of them. Or, you\'re shown a graph with shaded regions and asked which inequality system matches.',
            mustDo: [
                'A solution to a system must make EVERY inequality true. One failure → that\'s not the answer. Move on.',
                'When testing a candidate point, substitute into each inequality in turn. Stop as soon as one fails — you don\'t need to check the rest.',
                'For "which graph matches" questions, pick two test points: one clearly inside the shaded region, one clearly outside. If the inside point satisfies the system and the outside doesn\'t, you found the right system.'
            ],
            commonTrap: {
                name: 'Satisfies only one inequality, not both',
                disguise: 'The wrong choice satisfies the FIRST inequality (which the SAT lists first), tempting a rushed student to pick it without checking the second. Always test every inequality before you commit.'
            },
            desmos: 'Type each inequality into a new row. Desmos shades each half-plane in a different color. The solution region is wherever ALL the shadings overlap. Click any point in that overlap region to see its coordinates — that\'s a valid solution. Then check whether any answer choice matches.'
        },
        {
            id: 'graph-or-table-reading',
            title: 'Read a value from a graph or table',
            count: 2,
            cuePhrases: [
                '"based on the graph shown"',
                '"according to the table, f(3) = ..."',
                '"the value of y when x = ..."'
            ],
            definition: 'No calculation. The answer is right there on the graph or in the table — you just have to read it without misidentifying which axis is which.',
            mustDo: [
                'Before you look up anything, name what each axis (or each column) represents. The SAT loves swapping x and y, or using "pressure" and "temperature" instead of x and y.',
                'Find the input value first (where you need to start), then read across or up to find the output.',
                'Pay attention to units. If the y-axis is in thousands of dollars and the answer choices are in dollars, you need to multiply.'
            ],
            commonTrap: {
                name: 'Wrong axis — read x for y or vice versa',
                disguise: 'The wrong answer is the value you\'d get if you swapped the coordinates. This trap is brutal when the axes use unfamiliar labels (kelvins, atmospheres, kilometres) and your brain doesn\'t auto-correct.'
            },
            desmos: 'Less useful here since the question is about reading what\'s shown — but if you can identify the function from the graph, type it into Desmos and ask for specific values directly with `f(3)`, `f(-2)`, etc. For table questions, just be patient and methodical.'
        }
    ]
};
