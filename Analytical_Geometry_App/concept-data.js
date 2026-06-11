// Analytical Geometry & Trig — concept reference.
window.CONCEPT_DATA = {
    appId: 'Analytical_Geometry_App',
    appName: 'Analytical Geometry & Trig',
    appIcon: '⭕',
    intro: 'Circles, right triangles, and trig. Six patterns. Recognise the form (circle equation, special right triangle, SOHCAHTOA setup) and the question almost solves itself.',
    archetypes: [
        {
            id: 'circle-equation',
            title: 'Circle equation: center and radius',
            cuePhrases: ['"(x − h)² + (y − k)² = r²"', '"the center of the circle"', '"x² + y² + Dx + Ey + F = 0"'],
            definition: 'Identify the center and radius from a circle equation. Or convert from general to standard form.',
            mustDo: [
                'Standard form: (x − h)² + (y − k)² = r². Center is (h, k), radius is r (NOT r²).',
                'Sign of h and k flips: (x − 3) means h = +3.',
                'General form: complete the square on x and y to convert to standard form.'
            ],
            commonTrap: {
                name: 'Used r² as the radius',
                disguise: 'Equation says r² = 25 means r = 5, not r = 25. Take the square root.'
            },
            desmos: 'Type the equation as written. Desmos draws the circle. Click the center; Desmos shows (h, k). Measure radius from center to edge.'
        },
        {
            id: 'arc-and-sector',
            title: 'Arc length and sector area',
            cuePhrases: ['"the length of arc..."', '"the area of the sector"', '"central angle of θ degrees"'],
            definition: 'A piece of a circle. Compute arc length or sector area using the central angle.',
            mustDo: [
                'Arc length = (θ/360) × 2πr.',
                'Sector area = (θ/360) × πr².',
                'If θ is in radians: arc = rθ, sector = (1/2)r²θ.'
            ],
            commonTrap: {
                name: 'Used degree formula on radian angle',
                disguise: 'A 60° angle uses θ/360. A π/3 radian angle uses θ directly (in radians). Check units before applying the formula.'
            },
            desmos: 'Type the formula straight: `(60/360) * 2 * pi * 5` for an arc. Or use Desmos in degree mode and let it handle it.'
        },
        {
            id: 'sohcahtoa',
            title: 'Right triangle trig (SOHCAHTOA)',
            cuePhrases: ['"sin(x) = ..."', '"the value of cos(θ)"', '"a right triangle with angle..."'],
            definition: 'A right triangle with a labelled angle. Use SOH-CAH-TOA to find a ratio or a side.',
            mustDo: [
                'sin(angle) = Opposite / Hypotenuse. cos(angle) = Adjacent / Hypotenuse. tan(angle) = Opposite / Adjacent.',
                '"Opposite" and "adjacent" are relative to the angle you\'re using — not a fixed side.',
                'For a missing side: set up the appropriate ratio, then solve.'
            ],
            commonTrap: {
                name: 'Used sin where cos was needed',
                disguise: 'If the question gives you the angle and the hypotenuse and asks for the side ADJACENT to the angle, use cos — not sin. Always identify opposite vs adjacent first.'
            },
            desmos: 'Set Desmos to degree mode (gear icon → degrees). Then type `sin(30) * 10` etc. directly.'
        },
        {
            id: 'special-right-triangles',
            title: 'Special right triangles (30-60-90, 45-45-90)',
            cuePhrases: ['"a 45-45-90 triangle"', '"a 30-60-90 triangle"', '"an equilateral triangle inscribed in..."'],
            definition: 'A right triangle with angles 30-60-90 or 45-45-90. Side ratios are fixed.',
            mustDo: [
                '45-45-90: sides are in ratio 1 : 1 : √2. Legs equal, hypotenuse = leg × √2.',
                '30-60-90: sides are in ratio 1 : √3 : 2. Across from 30°, 60°, 90° respectively.',
                'Identify which angle each given side is opposite from — that locks the ratio.'
            ],
            commonTrap: {
                name: 'Swapped the 1 and √3 in 30-60-90',
                disguise: 'Across from 30° is 1. Across from 60° is √3. Students reverse this. Memorise: smaller angle, smaller side.'
            },
            desmos: 'For numerical answers, type `5 * sqrt(2)` or `5 * sqrt(3)` directly.'
        },
        {
            id: 'pythagorean-on-coordinates',
            title: 'Distance and midpoint on coordinate plane',
            cuePhrases: ['"the distance between (a,b) and (c,d)"', '"the midpoint of..."', 'two points given'],
            definition: 'Two points on the xy-plane. Find distance, midpoint, or use coordinates with Pythagorean theorem.',
            mustDo: [
                'Distance = √[(x₂ − x₁)² + (y₂ − y₁)²]. It\'s the Pythagorean theorem in disguise.',
                'Midpoint = ((x₁ + x₂)/2, (y₁ + y₂)/2). Average of each coordinate.',
                'For a circle equation question, distance from center to any point on the circle = radius.'
            ],
            commonTrap: {
                name: 'Forgot to square the differences',
                disguise: 'Distance is NOT (x₂ − x₁) + (y₂ − y₁). You have to square each difference, add, then take the square root.'
            },
            desmos: 'Plot both points. Click them — Desmos can give the distance directly via a measurement tool, or compute `sqrt((x2-x1)^2 + (y2-y1)^2)` manually.'
        },
        {
            id: 'inscribed-or-tangent-angles',
            title: 'Inscribed angles, tangent lines, circle theorems',
            cuePhrases: ['"a tangent to the circle"', '"inscribed angle"', '"the chord..."'],
            definition: 'A circle with lines, angles, or chords drawn in. Apply circle theorems.',
            mustDo: [
                'Inscribed angle = (1/2) × central angle (both subtending the same arc).',
                'Tangent ⊥ radius at the point of tangency. (A right angle is formed.)',
                'Angle in a semicircle (subtended by a diameter) is always 90°.'
            ],
            commonTrap: {
                name: 'Doubled an inscribed angle instead of halving',
                disguise: 'Inscribed angle is HALF the central angle, not twice it. The central angle is the bigger one.'
            },
            desmos: 'Hard to use Desmos for these. Mark the figure carefully — every right angle, every equal angle.'
        }
    ]
};
