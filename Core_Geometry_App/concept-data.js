// Core Geometry — concept reference.
window.CONCEPT_DATA = {
    appId: 'Core_Geometry_App',
    appName: 'Core Geometry',
    appIcon: '',
    intro: 'Core Geometry is formula recognition. Seven patterns. Identify the figure, recall the formula, plug in. The math is rarely hard — the trap is using the wrong formula.',
    archetypes: [
        {
            id: 'area-perimeter-rectangle',
            title: 'Area, perimeter, rectangles and triangles',
            cuePhrases: ['"the area of the rectangle"', '"the perimeter"', '"a right triangle with legs..."'],
            definition: 'Basic area or perimeter for rectangles, triangles, parallelograms, trapezoids.',
            mustDo: [
                'Rectangle: Area = length × width. Perimeter = 2(l + w).',
                'Triangle: Area = (1/2) × base × height. The height is PERPENDICULAR to the base.',
                'Trapezoid: Area = (1/2)(b₁ + b₂) × h.'
            ],
            commonTrap: {
                name: 'Used the slant instead of the perpendicular height',
                disguise: 'For triangles and trapezoids, the "height" is the perpendicular distance to the base, NOT a slanted side. Look for the right angle marker.'
            },
            desmos: 'For shapes drawn on a coordinate plane, plot the vertices, use the distance formula for sides, then apply the area formula.'
        },
        {
            id: 'circle-properties',
            title: 'Circle: area, circumference, sector',
            cuePhrases: ['"the area of the circle"', '"circumference"', '"arc length"', '"sector area"'],
            definition: 'Circles or parts of circles. Area, circumference, arc, or sector.',
            mustDo: [
                'Area = πr². Circumference = 2πr.',
                'Arc length = (angle/360) × 2πr. Sector area = (angle/360) × πr².',
                'If given diameter, halve it for r — don\'t plug d into a radius formula.'
            ],
            commonTrap: {
                name: 'Used diameter as radius',
                disguise: 'Diameter is 2r. Wrong answer plugs d in where r belongs, giving 4× the correct area.'
            },
            desmos: 'For circles on a coordinate plane, write `(x - h)² + (y - k)² = r²`. Plot and verify visually.'
        },
        {
            id: 'volume-3d',
            title: 'Volume: prisms, cylinders, cones, spheres',
            cuePhrases: ['"the volume of the cylinder"', '"a right circular cone"', '"a rectangular prism"'],
            definition: 'Volume of a 3D solid. Each shape has its own formula — and they\'re given on the reference sheet.',
            mustDo: [
                'Prism / cylinder: V = (base area) × height.',
                'Cone / pyramid: V = (1/3)(base area)(height).',
                'Sphere: V = (4/3)πr³. Surface area = 4πr².'
            ],
            commonTrap: {
                name: 'Forgot the 1/3 for cones/pyramids',
                disguise: 'Cone volume is one-third of the equivalent cylinder. Wrong answer omits the 1/3. Always check: pointed top → divide by 3.'
            },
            desmos: 'Type the formula with values: `pi * 5^2 * 10` for a cylinder. Desmos handles the arithmetic.'
        },
        {
            id: 'triangle-angle-sum',
            title: 'Triangle angle sum and exterior angles',
            cuePhrases: ['"the measure of angle..."', '"in triangle ABC..."', '"the angles of a triangle"'],
            definition: 'Find a missing angle in a triangle, or use exterior angle theorem.',
            mustDo: [
                'Interior angles of any triangle sum to 180°.',
                'Exterior angle = sum of the two non-adjacent interior angles.',
                'Isoceles triangle: base angles are equal. Equilateral: all 60°.'
            ],
            commonTrap: {
                name: 'Forgot exterior + adjacent interior = 180°',
                disguise: 'An exterior angle and its adjacent interior angle ALWAYS form a straight line (180°). Useful when the figure shows one of each.'
            },
            desmos: 'Set up equations: `a + b + c = 180`, then plug knowns. Solve for the unknown.'
        },
        {
            id: 'parallel-lines-transversal',
            title: 'Parallel lines cut by a transversal',
            cuePhrases: ['"lines ℓ and m are parallel"', '"a transversal cuts..."', 'two parallel lines with crossing line'],
            definition: 'Two parallel lines crossed by a third line. Find missing angles using the angle relationships.',
            mustDo: [
                'Corresponding angles: equal. (Same position at each intersection.)',
                'Alternate interior angles: equal. (Opposite sides of transversal, between the parallel lines.)',
                'Co-interior (same-side interior) angles: sum to 180°.'
            ],
            commonTrap: {
                name: 'Treated non-parallel lines as parallel',
                disguise: 'Angle relationships only hold IF the lines are parallel. The problem must say so (or mark it). Don\'t assume from a drawing.'
            },
            desmos: 'Less useful here. Mark the figure with all angles you derive. Vertical angles are also equal — use them as fallback.'
        },
        {
            id: 'similar-triangles',
            title: 'Similar triangles (proportional sides)',
            cuePhrases: ['"triangle ABC is similar to..."', '"the ratio of corresponding sides"', '"in similar triangles..."'],
            definition: 'Two triangles share the same angles. Corresponding sides are in proportion.',
            mustDo: [
                'Identify corresponding sides — pair them by their position relative to the matching angles.',
                'Set up ratios: side_A1 / side_B1 = side_A2 / side_B2.',
                'Cross-multiply and solve for the unknown.'
            ],
            commonTrap: {
                name: 'Paired sides wrong',
                disguise: 'In ΔABC ~ ΔDEF, side AB corresponds to DE, not DF. Order of vertices matters. Match by position.'
            },
            desmos: 'Set up the proportion as an equation and let Desmos solve.'
        },
        {
            id: 'pythagorean-theorem',
            title: 'Pythagorean theorem (right triangles)',
            cuePhrases: ['"the hypotenuse"', '"a right triangle with legs..."', '"find the length of..."'],
            definition: 'A right triangle. Apply a² + b² = c².',
            mustDo: [
                'c is always the hypotenuse — the longest side, opposite the right angle.',
                'a² + b² = c². Solve for whichever side is unknown.',
                'Recognise Pythagorean triples: 3-4-5, 5-12-13, 8-15-17 — and their multiples.'
            ],
            commonTrap: {
                name: 'Put a leg in the c slot',
                disguise: 'If you set leg² + leg² = leg², your answer will be wrong. Always identify the hypotenuse FIRST.'
            },
            desmos: 'Type `sqrt(a^2 + b^2)` for the hypotenuse, or `sqrt(c^2 - a^2)` for a missing leg.'
        }
    ]
};
