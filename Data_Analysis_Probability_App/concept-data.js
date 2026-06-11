// Data Analysis & Probability — concept reference.
window.CONCEPT_DATA = {
    appId: 'Data_Analysis_Probability_App',
    appName: 'Data Analysis & Probability',
    appIcon: '🎲',
    intro: 'Data and probability questions are reading-comprehension as much as math. Seven patterns. Identify the chart type and the probability rule — the arithmetic is trivial after that.',
    archetypes: [
        {
            id: 'read-scatterplot-line-of-best-fit',
            title: 'Scatterplot and line of best fit',
            cuePhrases: ['"based on the scatterplot"', '"line of best fit"', '"predicts the value of..."'],
            definition: 'A scatterplot with a regression line. Read a value or interpret slope/intercept.',
            mustDo: [
                'Slope of the line = predicted change in y per one-unit increase in x.',
                'y-intercept = predicted y when x = 0 (often not meaningful in context, but it\'s the number).',
                'To predict: plug x into the equation, read y.'
            ],
            commonTrap: {
                name: 'Extrapolated beyond the data range',
                disguise: 'If the data spans x = 0 to 10, predictions at x = 50 are unreliable — but SAT may ask anyway. Be aware that this is a known weakness.'
            },
            desmos: 'Plot the line of best fit (`y = mx + b`). Type `f(value)` to predict. To find when y = target, set `f(x) = target` and solve.'
        },
        {
            id: 'mean-median-mode',
            title: 'Mean, median, mode',
            cuePhrases: ['"the mean of the data set"', '"the median"', '"which measure best represents..."'],
            definition: 'Compute or compare measures of centre. Recognise when one is better than another.',
            mustDo: [
                'Mean = sum / count. Pulled by outliers — sensitive.',
                'Median = middle value when sorted. Robust to outliers.',
                'Mode = most frequent value. Useful only when one value dominates.'
            ],
            commonTrap: {
                name: 'Used mean when median was needed',
                disguise: 'When data has outliers (income, house prices, extreme test scores), median is a better measure of centre. Mean is misleading.'
            },
            desmos: 'In a list, type `mean([1,2,3,4,5])` or `median([1,2,3,4,5])`. Exact answer.'
        },
        {
            id: 'standard-deviation-spread',
            title: 'Standard deviation and spread',
            cuePhrases: ['"the standard deviation"', '"which has greater spread"', '"more variable"'],
            definition: 'Compare two data sets by spread. Or determine which has higher standard deviation.',
            mustDo: [
                'Standard deviation measures spread around the mean. Bigger SD = more spread out.',
                'Data clustered tightly around the mean → small SD.',
                'You usually compare visually or by looking at the range, NOT computing SD by hand.'
            ],
            commonTrap: {
                name: 'Equated range with standard deviation',
                disguise: 'Two data sets can have the same range but different SD. The data with most values near the mean has lower SD, even if its outliers go just as far.'
            },
            desmos: '`stdev([1,2,3,4,5])` if you really need a number. Usually visual comparison is enough.'
        },
        {
            id: 'two-way-table-probability',
            title: 'Two-way table probability',
            cuePhrases: ['"the table shows..."', '"probability that a randomly selected..."', '"given that..."'],
            definition: 'A two-way table cross-tabs two categorical variables. Pick the right cell and the right denominator.',
            mustDo: [
                'Identify the cell that matches the desired outcome (numerator).',
                'Identify the relevant total (denominator). For "given that...", restrict to that row or column.',
                'Probability = cell / appropriate total.'
            ],
            commonTrap: {
                name: 'Used the grand total instead of the conditional total',
                disguise: '"Given that a person is male, the probability they are left-handed" uses the MALE total (not grand total) as denominator. "Given" restricts the population.'
            },
            desmos: 'Type the fraction: `count / total`. Get the decimal or percent.'
        },
        {
            id: 'compound-probability',
            title: 'Compound probability (and / or / not)',
            cuePhrases: ['"the probability of both A and B"', '"A or B"', '"the complement of..."'],
            definition: 'Probability of combined events: both, either, or neither.',
            mustDo: [
                'P(A and B) for independent events = P(A) × P(B).',
                'P(A or B) = P(A) + P(B) − P(A and B). (Subtract overlap so it\'s not double-counted.)',
                'P(not A) = 1 − P(A).'
            ],
            commonTrap: {
                name: 'Added probabilities without subtracting overlap',
                disguise: 'P(red OR face card) is NOT P(red) + P(face card). Some red cards are face cards. Subtract the overlap to avoid double-counting.'
            },
            desmos: 'For independent events, type `0.3 * 0.4`. For "or", type `0.3 + 0.4 - 0.12`. Step through.'
        },
        {
            id: 'histogram-or-boxplot-reading',
            title: 'Read a histogram or box plot',
            cuePhrases: ['"the histogram shows..."', '"the box plot represents..."', '"the median is closest to..."'],
            definition: 'Read values from a histogram (frequency by interval) or box plot (median, quartiles, range).',
            mustDo: [
                'Histogram: each bar height = number of values in that interval. Total count = sum of bar heights.',
                'Box plot: line inside box = median. Box edges = Q1 and Q3. Whiskers = min and max (or 1.5×IQR rule).',
                'For "how many are above X", sum bar heights to the right of X.'
            ],
            commonTrap: {
                name: 'Read box length as the spread',
                disguise: 'The box itself is the INTERQUARTILE range (Q3 − Q1), containing the middle 50%. The whiskers extend further. Range = max − min, not box width.'
            },
            desmos: 'Less useful — these are visual reads. Be methodical: identify each landmark before computing.'
        },
        {
            id: 'percentile-or-rank',
            title: 'Percentile or rank in a distribution',
            cuePhrases: ['"at the 75th percentile"', '"X% scored at or below..."'],
            definition: 'Convert between a raw score and its percentile rank, or vice versa.',
            mustDo: [
                'Percentile = (number at or below value) / total × 100.',
                '75th percentile means 75% scored at or below this value.',
                'Median is the 50th percentile. Q1 = 25th. Q3 = 75th.'
            ],
            commonTrap: {
                name: 'Confused percentile with percentage correct',
                disguise: 'Being at the 90th percentile does NOT mean getting 90% right. It means scoring higher than 90% of people. Big difference.'
            },
            desmos: 'Calculation: count people at or below, divide by total, multiply by 100.'
        }
    ]
};
