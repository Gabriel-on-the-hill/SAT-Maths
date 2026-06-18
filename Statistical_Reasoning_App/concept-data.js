// Statistical Reasoning — concept reference.
window.CONCEPT_DATA = {
    appId: 'Statistical_Reasoning_App',
    appName: 'Statistical Reasoning',
    appIcon: '',
    intro: 'Statistical Reasoning tests inference, not arithmetic. Five patterns. The trap is always overreaching from the sample.',
    archetypes: [
        {
            id: 'random-sample-generalize',
            title: 'Random sample → generalise to population',
            cuePhrases: ['"a random sample of 100..."', '"based on the sample..."', '"best estimate of the population"'],
            definition: 'A study uses a random sample. You estimate a number for the whole population by scaling up.',
            mustDo: [
                'Compute the proportion in the sample (e.g., 6 out of 20 = 30%).',
                'Apply that proportion to the full population (30% of 50 = 15).',
                'Random sampling justifies generalising to the SAME population the sample was drawn from — nothing wider.'
            ],
            commonTrap: {
                name: 'Generalised beyond the sampled group',
                disguise: 'A sample of city council members tells you about city council, NOT about all city residents. The wrong answer broadens the scope. The sampled group is the boundary.'
            },
            desmos: 'Type `(sample_yes / sample_total) * population_size`. One line, exact answer.'
        },
        {
            id: 'bias-and-non-random-samples',
            title: 'Identifying bias / non-random samples',
            cuePhrases: ['"a survey was conducted at..."', '"only included people who..."', '"can the conclusion be drawn?"'],
            definition: 'A study\'s conclusion is suspect. You identify whether the sample was biased.',
            mustDo: [
                'Random selection from the target group → conclusion about the group is valid.',
                'Self-selection, convenience sampling, or surveys at a specific location → biased.',
                'A biased sample cannot support generalising to the broader population.'
            ],
            commonTrap: {
                name: 'Accepted a flawed sample',
                disguise: 'A poll at a baseball stadium asking about favourite sport is biased toward baseball fans. The wrong answer accepts the conclusion. Always check WHERE and HOW the sample was drawn.'
            },
            desmos: 'Not applicable here — this is conceptual. Read the study description carefully for sampling method.'
        },
        {
            id: 'random-assignment-causation',
            title: 'Random assignment → causation',
            cuePhrases: ['"randomly assigned to one of two groups"', '"the experiment showed..."', '"can a cause-and-effect relationship be established"'],
            definition: 'An experiment randomly assigns subjects to treatment vs control. You determine if causation is justified.',
            mustDo: [
                'Random assignment of subjects to treatments → causal claim is valid.',
                'Observational study (no random assignment) → only correlation, not causation.',
                'Combined: random sample AND random assignment → causal claim AND generalisable.'
            ],
            commonTrap: {
                name: 'Confused random sample with random assignment',
                disguise: 'Random SAMPLE lets you generalise the result. Random ASSIGNMENT lets you claim causation. They are different things. You may need both.'
            },
            desmos: 'Not applicable. Conceptual question — read carefully.'
        },
        {
            id: 'margin-of-error',
            title: 'Margin of error / confidence interval',
            cuePhrases: ['"with a margin of error of ±3%"', '"the 95% confidence interval is..."', '"plausible values for the population mean"'],
            definition: 'Survey gives a point estimate plus a margin of error. You interpret the range of plausible values.',
            mustDo: [
                'The interval (estimate − margin) to (estimate + margin) is the plausible range.',
                'A larger sample size shrinks the margin.',
                'The interval is about the POPULATION value, not individuals.'
            ],
            commonTrap: {
                name: 'Said "X% are within the range"',
                disguise: 'The margin of error tells you where the population PARAMETER likely is, not where individual values fall. A confidence interval for the mean is about the mean.'
            },
            desmos: 'Type `estimate - margin` and `estimate + margin` to get the interval endpoints.'
        },
        {
            id: 'evaluating-a-claim',
            title: 'Evaluating a stated claim',
            cuePhrases: ['"which conclusion is best supported by the data"', '"which statement is justified"'],
            definition: 'Several conclusions are offered. You pick the one the data actually supports.',
            mustDo: [
                'Right answer: claim stays within what the data measured. Same population, same variable.',
                'Wrong answers usually: (a) overreach the population, (b) imply causation from correlation, or (c) flip the relationship.',
                'Pick the most modest, scope-respecting claim.'
            ],
            commonTrap: {
                name: 'Picked the dramatic claim',
                disguise: 'The wrong answer is usually the boldest one. SAT prefers conservative, narrow conclusions. If a claim feels "too strong", it probably is.'
            },
            desmos: 'Not applicable. Conceptual — pick the safest claim.'
        }
    ]
};
