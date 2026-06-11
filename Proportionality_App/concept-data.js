// Proportionality & Percentages — concept reference.
window.CONCEPT_DATA = {
    appId: 'Proportionality_App',
    appName: 'Proportionality & Percentages',
    appIcon: '%',
    intro: 'Percent and rate questions are easy points the SAT lets students throw away. Six patterns. Get them right and you bank fast time for the hard problems.',
    archetypes: [
        {
            id: 'percent-of-number',
            title: 'Percent of a number',
            cuePhrases: ['"what is 15% of 80"', '"40% of x is 20"'],
            definition: 'Direct percent calculation. "p% of N" = (p/100) × N.',
            mustDo: [
                'Convert percent to decimal: 15% = 0.15. 8% = 0.08 (not 0.8).',
                'Multiply: 0.15 × 80 = 12.',
                'For "p% of WHAT is N": set up (p/100) × x = N, solve for x.'
            ],
            commonTrap: {
                name: 'Misplaced decimal',
                disguise: '8% is 0.08, not 0.8. One zero matters. Triple-check the decimal placement.'
            },
            desmos: 'Type `0.15 * 80` directly. For unknowns: `0.15 * x = 12`, solve. Skip the algebra.'
        },
        {
            id: 'percent-change',
            title: 'Percent change (increase or decrease)',
            cuePhrases: ['"increased by 20%"', '"decreased by 15%"', '"what is the percent change from..."'],
            definition: 'Either compute a percent change, or apply one to find the new value.',
            mustDo: [
                'New value after increase: multiply by (1 + p/100). 20% increase → multiply by 1.20.',
                'New value after decrease: multiply by (1 − p/100). 15% decrease → multiply by 0.85.',
                'Percent change between two values: (new − old) / old × 100.'
            ],
            commonTrap: {
                name: '"Increase then decrease" doesn\'t cancel',
                disguise: 'A 20% increase followed by a 20% decrease does NOT return to the original. 100 → 120 → 96. Always multiply, never add/subtract the percents directly.'
            },
            desmos: 'Type `100 * 1.20 * 0.80` and read the result. Chain the multipliers — it\'s the only correct way to compound percent changes.'
        },
        {
            id: 'ratios-and-proportions',
            title: 'Ratios and proportions',
            cuePhrases: ['"the ratio of m to k is 1 to 5"', '"a / b = c / d, solve for..."', '"are in the ratio 3:4:5"'],
            definition: 'A ratio relates two quantities. A proportion sets two ratios equal — cross-multiply to solve.',
            mustDo: [
                'Ratio 1:5 means for every 1 of one quantity, there are 5 of the other.',
                'Proportion a/b = c/d → cross-multiply: ad = bc.',
                'For three-part ratios (3:4:5), the parts total 12. Each part is total/12 of one unit.'
            ],
            commonTrap: {
                name: 'Set up the proportion sideways',
                disguise: 'If miles/hour, both fractions must be miles on top, hours on bottom. Or both flipped. Never mix.'
            },
            desmos: 'Type the proportion: `a/b = c/d` and replace knowns. Desmos solves for the unknown. Verify by plugging back.'
        },
        {
            id: 'unit-conversion-rates',
            title: 'Unit conversions and rates',
            cuePhrases: ['"miles per hour to yards per second"', '"$X per gallon"', '"how many minutes in..."'],
            definition: 'Convert between units (miles → yards, hours → seconds) or compute total based on a rate.',
            mustDo: [
                'Set up conversions as fractions. Cancel units like algebra: (miles/hour) × (yards/mile) × (hour/seconds) → yards/second.',
                'For rate × time = total: identify rate, identify time period, multiply.',
                'Average speed = total distance / total time. NOT the average of two speeds.'
            ],
            commonTrap: {
                name: 'Averaged two different speeds directly',
                disguise: 'Going 60 mph then 40 mph for equal TIMES averages to 50 mph. For equal DISTANCES, it\'s 48 mph (harmonic mean). Read the question carefully.'
            },
            desmos: 'Type the full chain: `60 * (5280/3600)` for mph → ft/s. Let Desmos handle the arithmetic; you handle the unit cancelling.'
        },
        {
            id: 'percent-word-problem',
            title: 'Percent in a real-world context',
            cuePhrases: ['"the price was discounted by..."', '"after a 7% sales tax"', '"the population grew by..."'],
            definition: 'Percent applied to a real situation: sales tax, tip, discount, growth. Usually a multi-step word problem.',
            mustDo: [
                'Identify the base value (the "original" or "before" amount).',
                'Identify the percent and whether it\'s increase or decrease.',
                'Multiply: new = base × (1 ± percent/100). Stack multiple percents in sequence.'
            ],
            commonTrap: {
                name: 'Applied percent to the wrong base',
                disguise: 'A 10% discount then 7% tax: tax is on the DISCOUNTED price, not the original. Always identify what each percent acts on.'
            },
            desmos: 'Chain the operations: `original * (1 - discount) * (1 + tax)`. Step through one at a time.'
        },
        {
            id: 'mixture-or-density',
            title: 'Mixture, density, or composition problems',
            cuePhrases: ['"mass / volume"', '"30% acid solution"', '"density of..."'],
            definition: 'Quantities described by their composition: density (mass/volume), concentration (solute/solution), or percentage parts.',
            mustDo: [
                'Density = mass / volume. Concentration = solute / total solution.',
                'Mixing two solutions: total mass = sum of masses. Total concentration = total mass of solute / total volume.',
                'For "X% of total Y" type problems, set up the part/whole equation and solve.'
            ],
            commonTrap: {
                name: 'Added concentrations directly',
                disguise: 'Mixing 100ml of 20% acid with 100ml of 30% acid does NOT give 50% acid. It gives 25% (the total solute over total volume). Always work with masses, not percents.'
            },
            desmos: 'Set up `total_solute / total_volume`. Compute total_solute as a sum, total_volume as a sum, then divide.'
        }
    ]
};
