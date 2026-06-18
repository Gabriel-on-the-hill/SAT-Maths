const QUESTIONS_DATA = {
    "guided": [
        {
            "id": "2c76bcce",
            "difficulty": "Easy",
            "question": "<img src=\"assets/easy_2c76bcce.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 0,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice A is correct. It's given that the estimated mean weight of all handbags made by the company on a particular day is , with an associated margin of error of . It follows that plausible values for the mean weight are between and . Therefore, the most plausible conclusion is that the mean weight of all handbags made by the company on that day is between and . Choice B is incorrect and may result from conceptual or calculation errors. Choice C is incorrect and may result from conceptual or calculation errors. Choice D is incorrect and may result from conceptual or calculation errors.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Margin of error / confidence interval",
            "trapName": "Said ",
            "strategy": "The interval (estimate − margin) to (estimate + margin) is the plausible range.",
            "timeTarget": 60
        },
        {
            "id": "e7d9649f",
            "difficulty": "Easy",
            "question": "<img src=\"assets/easy_e7d9649f.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 1,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice B is correct. Let x be the number of people in the entire town that would be expected to name chocolate. Since the sample of 50 people was selected at random, it is reasonable to expect that the proportion of people who named chocolate as their favorite ice-cream flavor would be the same for both the sample and the town population. Symbolically, this can be expressed as . Using cross multiplication, ; solving for x yields 2,083. The choice closest to the value of 2,083 is choice B, 2,100. Choices A, C, and D are incorrect and may be the result of errors when setting up the proportion, solving for the unknown, or incorrectly comparing the choices to the number of people expected to name chocolate, 2,083.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Identifying bias / non-random samples",
            "trapName": "Accepted a flawed sample",
            "strategy": "Random selection from the target group → conclusion about the group is valid.",
            "timeTarget": 60
        },
        {
            "id": "0108ac2d",
            "difficulty": "Easy",
            "question": "<img src=\"assets/easy_0108ac2d.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice C is correct. It’s given that an estimated 38% of sampled students at the school were in support of a menu change, with a margin of error of 5.5%. It follows that the percent of the students at the school who support a menu change is 38% plus or minus 5.5%. The lower bound of this estimation is , or 32.5%. The upper bound of this estimation is , or 43.5%. Therefore, plausible values of the percent of the students at the school who support a menu change are between 32.5% and 43.5%. Choice A is incorrect. This is the percent of the sampled students at the school who support a menu change. Choices B and D are incorrect and may result from misinterpreting the margin of error.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Margin of error / confidence interval",
            "trapName": "Said ",
            "strategy": "The interval (estimate − margin) to (estimate + margin) is the plausible range.",
            "timeTarget": 60
        },
        {
            "id": "f04d40b2",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_f04d40b2.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice C is correct. It’s given that an estimated of people in the population support the legislation, with an associated margin of error of . Subtracting and adding the margin of error from the estimate gives an interval of plausible values for the true percentage of people in the population who support the legislation. Therefore, it’s plausible that between and of people in this population support the legislation. The corresponding numbers of people represented by these percentages in the population can be calculated by multiplying the total population, , by and by , which gives and , respectively. It follows that any value in the interval to is a plausible value for the total number of people in the population who support the proposed legislation. Of the choices given, only is in this interval. Choice A is incorrect. This is the number of people in the sample, rather than in the population, who support the legislation. Choice B is incorrect. This is the number of people in the sample who do not support the legislation. Choice D is incorrect. This is a plausible value for the total number of people in the population who do not support the proposed legislation.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Margin of error / confidence interval",
            "trapName": "Said ",
            "strategy": "The interval (estimate − margin) to (estimate + margin) is the plausible range.",
            "timeTarget": 60
        },
        {
            "id": "642519d7",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_642519d7.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 0,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice A is correct. Statement I need not be true. The fact that 78% of the 1,000 adults who were surveyed responded that they were satisfied with the air quality in the city does not mean that the exact same percentage of all adults in the city will be satisfied with the air quality in the city. Statement II need not be true because random samples, even when they are of the same size, are not necessarily identical with regard to percentages of people in them who have a certain opinion. Statement III need not be true for the same reason that statement II need not be true: results from different samples can vary. The variation may be even bigger for this sample since it would be selected from a different city. Therefore, none of the statements must be true. Choices B, C, and D are incorrect because none of the statements must be true.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "e03f3477",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_e03f3477.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 1,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice B is correct. It's given that based on a sample selected at random, it's estimated that of all adults who own televisions use their televisions to watch nature shows, with an associated margin of error of . Subtracting the margin of error from the estimate and adding the margin of error to the estimate gives an interval of plausible values for the true percentage of adults who own televisions who use their televisions to watch nature shows. This means it's plausible that between , or , and , or , of all adults who own televisions use their televisions to watch nature shows. Therefore, of the given choices, the most plausible conclusion is that between and of all adults who own televisions use their televisions to watch nature shows. Choice A is incorrect and may result from conceptual errors. Choice C is incorrect. To make a plausible conclusion about all adults who own televisions, the sample must be selected at random from all adults who own televisions, not just those who use their televisions to watch nature shows. Choice D is incorrect. Since the sample was selected at random from all adults who own televisions, a plausible conclusion can be made about all adults who own televisions.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Margin of error / confidence interval",
            "trapName": "Said ",
            "strategy": "The interval (estimate − margin) to (estimate + margin) is the plausible range.",
            "timeTarget": 60
        },
        {
            "id": "fc46af57",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_fc46af57.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 1,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice B is correct. It was estimated that 15% of the beads in the bag are red. Since the bag contains 10,000 beads, it follows that there are an estimated red beads. It’s given that the margin of error is 2%, or beads. If the estimate is too high, there could plausibly be red beads. If the estimate is too low, there could plausibly be red beads. Therefore, the most plausible statement of the actual number of red beads in the bag is . Choices A and D are incorrect and may result from misinterpreting the margin of error. It’s unlikely that more than 1,700 beads or fewer than 1,300 beads in the bag are red. Choice C is incorrect because 200 is the margin of error for the number of red beads, not the lower bound of the range of red beads.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Margin of error / confidence interval",
            "trapName": "Said ",
            "strategy": "The interval (estimate − margin) to (estimate + margin) is the plausible range.",
            "timeTarget": 60
        },
        {
            "id": "7ce2830a",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_7ce2830a.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 1,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice B is correct. The largest group to which the results of a study can be generalized is the population from which the random sample was chosen. In this case, the psychologist chose a random sample from all students at one particular middle school. Therefore, the largest group to which the results can be generalized is all the students at the school. Choice A is incorrect because this isn’t the largest group the results can be generalized to. Choices C and D are incorrect because these groups are larger than the population from which the random sample was chosen. Therefore, the sample isn’t representative of these groups.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "6fca0144",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_6fca0144.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. When a study uses a randomly selected sample, the largest group to which the results of the study can be applied is the population from which the sample was selected. It's given that the scientist randomly selected the trees from the baobab trees in a certain habitat that were years old. Therefore, the largest group to which the results of this study can be applied is all the baobab trees that were years old in this habitat. Choice A is incorrect. Since the sample was randomly selected from a population, the results can be applied to a larger group than the sample. Choice B is incorrect. The sample was selected from a population of baobab trees that were years old, not years old. Choice C is incorrect. The sample was selected from a certain tree habitat in South Africa, not from all the baobab trees that were years old in South Africa.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "308084c5",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_308084c5.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. Sample size is an appropriate reason for the margin of error to change. In general, a smaller sample size increases the margin of error because the sample may be less representative of the whole population. Choice A is incorrect. The margin of error will depend on the size of the sample of recorded votes, not the number of votes that could not be recorded. In any case, the smaller number of votes that could not be recorded for sample A would tend to decrease, not increase, the comparative size of the margin of error. Choice B is incorrect. Since the percent in favor for sample A is the same distance from 50% as the percent in favor for sample B, the percent of favorable responses doesn’t affect the comparative size of the margin of error for the two samples. Choice C is incorrect. If sample A had a larger margin of error than sample B, then sample A would tend to be less representative of the population. Therefore, sample A is not likely to have a larger sample size.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Margin of error / confidence interval",
            "trapName": "Said ",
            "strategy": "The interval (estimate − margin) to (estimate + margin) is the plausible range.",
            "timeTarget": 60
        }
    ],
    "independent": [
        {
            "id": "6a305cd0",
            "difficulty": "Easy",
            "question": "<img src=\"assets/easy_6a305cd0.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice C is correct. It’s given that the mean of the data from a random sample of a population is 37, with an associated margin of error of 3. The most appropriate conclusion that can be made is that the mean of the entire population will fall between 37, plus or minus 3. Therefore, the population mean is between and . Choice A is incorrect. While it’s an appropriate conclusion that the population mean is as low as , or 34, it isn’t appropriate to conclude that the population mean is less than 34. Choice B is incorrect. While it’s an appropriate conclusion that the population mean is as high as , or 40, it isn’t appropriate to conclude that the population mean is greater than 40. Choice D is incorrect. It isn’t an appropriate conclusion that the population mean is less than 34 or greater than 40.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "37930b2a",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_37930b2a.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 0,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice A is correct. The purpose of surveying a random sample of residents is to approximate the percent of the town residents that are satisfied with the concession stand. The sample doesn’t necessarily get the same result as surveying every resident of the town, nor would another sample necessarily have identical results. Therefore, although it’s possible that either statement I or statement II could prove true by surveying every resident of the town, these statements cannot be proven true solely based on the results of the sample. Choice B is incorrect because surveying a sample of the town residents may not have the same result as surveying all the town residents. Choices C and D are incorrect because surveying a different sample of residents could yield different results.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "53d97af5",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_53d97af5.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. The sample of 150 largemouth bass was selected at random from all the largemouth bass in the pond, and since 30% of the fish in the sample weighed more than 2 pounds, it can be concluded that approximately 30% of all largemouth bass in the pond weigh more than 2 pounds. Choices A, B, and C are incorrect. Since the sample contained 150 largemouth bass, of which 30% weighed more than 2 pounds, this result can be generalized only to largemouth bass in the pond, not to all fish in the pond.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Identifying bias / non-random samples",
            "trapName": "Accepted a flawed sample",
            "strategy": "Random selection from the target group → conclusion about the group is valid.",
            "timeTarget": 60
        },
        {
            "id": "f8f79e11",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_f8f79e11.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. The given estimated mean has an associated margin of error because from sample data, the population mean can’t be determined precisely. Rather, from the sample mean, an interval can be determined within which it’s plausible that the population’s mean is likely to lie. Since the estimated mean is 4.5 miles with an associated margin of error of 0.5 miles, it follows that between miles and miles, or between 4 and 5 miles, is plausibly the mean distance hiked for all visitors. Choices A, B, and C are incorrect. Based on the estimated mean, no determination can be made about the number of miles hiked for all visitors to the park.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Margin of error / confidence interval",
            "trapName": "Said ",
            "strategy": "The interval (estimate − margin) to (estimate + margin) is the plausible range.",
            "timeTarget": 60
        },
        {
            "id": "9ee22c16",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_9ee22c16.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 0,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> The correct answer is 3,540. According to the table, of 400 voters randomly sampled, the total number of men and women who plan to vote for Candidate A is . The best estimate of the total number of voters in the town who plan to vote for Candidate A is the fraction of voters in the sample who plan to vote for Candidate A, , multiplied by the total voter population of 6000. Therefore, the answer is .<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "grid-in",
            "answer": "3",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "9ba3e283",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_9ba3e283.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice C is correct. It is given that 34.6% of 26 students in Mr. Camp’s class reported that they had at least two siblings. Since 34.6% of 26 is 8.996, there must have been 9 students in the class who reported having at least two siblings and 17 students who reported that they had fewer than two siblings. It is also given that the average eighth-grade class size in the state is 26 and that Mr. Camp’s class is representative of all eighth-grade classes in the state. This means that in each eighth-grade class in the state there are about 17 students who have fewer than two siblings. Therefore, the best estimate of the number of eighth-grade students in the state who have fewer than two siblings is 17 × (number of eighth-grade classes in the state), or . Choice A is incorrect because 16,200 is the best estimate for the number of eighth-grade students in the state who have at least, not fewer than, two siblings. Choice B is incorrect because 23,400 is half of the estimated total number of eighth-grade students in the state; however, since the students in Mr. Camp’s class are representative of students in the eighth-grade classes in the state and more than half of the students in Mr. Camp’s class have fewer than two siblings, more than half of the students in each eighth- grade class in the state have fewer than two siblings, too. Choice D is incorrect because 46,800 is the estimated total number of eighth-grade students in the state.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "85939da5",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_85939da5.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. The given margin of error of 3% indicates that the actual percent of all US teens who are heavy texters is likely within 3% of the estimate of 30%, or between 27% and 33%. Therefore, it is unlikely, or doubtful, that the percent of all US teens who are heavy texters would be 35%. Choice A is incorrect. The margin of error doesn’t provide any information about the accuracy of reporting in the study. Choice B is incorrect. Based on the estimate and given margin of error, it is unlikely that the percent of all US teens who are heavy texters would be less than 27%, but it is possible. Choice C is incorrect. While the percent of all US teens who are heavy texters is likely between 27% and 33%, any value within this interval is equally likely. We can’t be certain that the value is exactly 33%.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Margin of error / confidence interval",
            "trapName": "Said ",
            "strategy": "The interval (estimate − margin) to (estimate + margin) is the plausible range.",
            "timeTarget": 60
        },
        {
            "id": "7d68096f",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_7d68096f.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. It's given that the organizer selected teams at random from all trivia teams in the tournament. A table is also given displaying the information for the teams in the sample that practiced for at least hours per week. Selecting a sample of a reasonable size at random to use for a survey allows the results from that survey to be applied to the population from which the sample was selected, but not beyond this population. Thus, only the sampling method information is necessary to determine the largest population to which the results of the study can be generalized. Since the organizer selected the sample at random from all trivia teams in the tournament, the largest population to which the results of the study can be generalized is all trivia teams in the tournament. Choice A is incorrect. The sample was selected at random from all trivia teams in the tournament, not just from the teams that scored an average of or more points per round.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        }
    ],
    "homework": [
        {
            "id": "90eed2e5",
            "difficulty": "Easy",
            "question": "<img src=\"assets/easy_90eed2e5.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice C is correct. Because a random sample of the city council was polled, the proportion of the sample who supported the bill is expected to be approximately equal to the proportion of the total city council who supports the bill. Since 6 of the 20 polled, or 30%, supported the bill, it can be estimated that , or 15, city council members support the bill. Choice A is incorrect. This is the number of city council members in the sample who supported the bill. Choice B is incorrect and may result from a computational error. Choice D is incorrect. This is the number of city council members in the sample of city council members who were not polled.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "answer": "C",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "f4b3672a",
            "difficulty": "Easy",
            "question": "<img src=\"assets/easy_f4b3672a.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice C is correct. The mean of the 5 samples is trees per acre. The best estimate for the total number of trees in the forest is the product of the mean number of trees per acre in the sample and the total number of acres in the forest. This is (56)(253) = 14,168, which is between 13,500 and 14,500. Choice A is incorrect and may result from multiplying the minimum number of trees per acre in the sample, 45, by the number of acres, 253. Choice B is incorrect and may result from multiplying the median number of trees per acre in the sample, 52, by the number of acres, 253. Choice D is incorrect and may result from multiplying the maximum number of trees per acre in the sample, 73, by the number of acres, 253.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "89f8d08a",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_89f8d08a.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. It’s given that the manager took a random selection of the receipts of 80 customers from a total of 1,500. It’s also given that of those 80 receipts, 20 showed that the customer had purchased fruit. This means that an appropriate estimate of the fraction of customers who purchased fruit is , or . Multiplying this fraction by the total number of customers yields . Therefore, the best estimate for the number of customers who purchased fruit is 375. Choices A and B are incorrect because an exact number of customers can’t be known from taking a random selection. Additionally, choice A may also be the result of a calculation error. Choice C is incorrect and may result from a calculation error.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "b4f5a7ca",
            "difficulty": "Medium",
            "question": "<img src=\"assets/medium_b4f5a7ca.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice C is correct. Selecting a sample at random when conducting a survey allows the results to be generalized to the population from which the sample was selected, but not beyond this population. In this situation, the population that the sample was selected from is history professors from the California State Universities. Therefore, the largest population to which the results of the survey can be generalized is all history professors at all California State Universities. Choices A, B, and D are incorrect. Since the sample was selected at random from history professors from the California State Universities, the results of the survey can’t be generalized to all professors in the United States, all history professors in the United States, or all professors at all California State Universities. All three of these populations may use different texts and therefore may name different publishers.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "4a422e3e",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_4a422e3e.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice C is correct. In order to use a sample mean to estimate the mean for a population, the sample must be representative of the population (for example, a simple random sample). In this case, Tabitha surveyed 20 families in a playground. Families in the playground are more likely to have children than other households in the community. Therefore, the sample isn’t representative of the population. Hence, the sampling method is flawed and may produce a biased estimate. Choices A and D are incorrect because they incorrectly assume the sampling method is unbiased. Choice B is incorrect because a sample of size 20 could be large enough to make an estimate if the sample had been representative of all the families in the community.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Identifying bias / non-random samples",
            "trapName": "Accepted a flawed sample",
            "strategy": "Random selection from the target group → conclusion about the group is valid.",
            "timeTarget": 60
        },
        {
            "id": "1ea09200",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_1ea09200.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 1,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice B is correct. Selecting a sample of a reasonable size at random to use for a survey allows the results from that survey to be applied to the population from which the sample was selected, but not beyond this population. In this case, the population from which the sample was selected is all fourth-grade students at a certain school. Therefore, the results of the survey can be applied to all fourth-grade students at the school. Choice A is incorrect. The results of the survey can be applied to the 40 students who were surveyed. However, this isn’t the largest group to which the results of the survey can be applied. Choices C and D are incorrect. Since the sample was selected at random from among the fourth-grade students at a certain school, the results of the survey can’t be applied to other students at the school or to other fourth-grade students who weren’t represented in the survey results. Students in other grades in the school or other fourth-grade students in the country may feel differently about announcements than the fourth-grade students at the school.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "aa43b41f",
            "difficulty": "Hard",
            "question": "<img src=\"assets/hard_aa43b41f.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 1,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice B is correct. In order for the poll results from a sample of a population to represent the entire population, the sample must be representative of the population. A sample that is randomly selected from a population is more likely than a sample of the type described to represent the population. In this case, the people who responded were people with access to cable television and websites, which aren’t accessible to the entire population. Moreover, the people who responded also chose to watch the show and respond to the poll. The people who made these choices aren’t representative of the entire population of the United States because they were not a random sample of the population of the United States. Choices A, C, and D are incorrect because they present reasons unrelated to whether the sample is representative of the population of the United States.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        }
    ],
    "exam": [
        {
            "id": "9bf4c545",
            "difficulty": "Easy",
            "question": "<img src=\"assets/easy_9bf4c545.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. The members of the city council wanted to assess opinions of all city residents. To gather an unbiased sample, the council should have used a random sampling design to select subjects from all city residents. The given survey introduced a sampling bias because the 500 city residents surveyed were all dog owners. This sample is not representative of all city residents because not all city residents are dog owners. Choice A is incorrect because when the sampling method isn’t random, there is no guarantee that the survey results will be reliable; hence, they cannot be generalized to the entire population. Choice B is incorrect because a larger sample of residents who are dog owners would not correct the sampling bias. Choice C is incorrect because a survey sample of entirely non–dog owners would likely have a biased opinion, just as a sample of dog owners would likely have a biased opinion.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Random sample → generalise to population",
            "trapName": "Generalised beyond the sampled group",
            "strategy": "Compute the proportion in the sample (e.g., 6 out of 20 = 30%).",
            "timeTarget": 60
        },
        {
            "id": "82dfb646",
            "difficulty": "Easy",
            "question": "<img src=\"assets/easy_82dfb646.png\" class=\"question-img\" alt=\"Question\">",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 3,
            "explanation": "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br><strong>Algebraic Method:</strong> Choice D is correct. The sample was selected from a group of people who indicated that they liked the book. It is inappropriate to generalize the result of the survey beyond the population from which the participants were selected. Choice D is the most appropriate inference from the survey results because it describes a conclusion about people who liked the book, and the results of the survey indicate that most people who like the book disliked the movie. Choices A, B, and C are incorrect because none of these inferences can be drawn from the survey results. Choices A and B need not be true. The people surveyed all liked the book on which the movie was based, which is not necessarily true of all people who go see movies or all people who read books. Thus, the people surveyed are not representative of all people who go see movies or all people who read books. Therefore, the results of this survey cannot appropriately be extended to at least 95% of people who go see movies or to at least 95% of people who read books. Choice C need not be true because the sample includes only people who liked the book, and so the results do not extend to people who dislike the book.<br><br><strong>Common mistake:</strong> Beware of biased samples or small sample sizes.",
            "type": "multiple-choice",
            "archetype": "Identifying bias / non-random samples",
            "trapName": "Accepted a flawed sample",
            "strategy": "Random selection from the target group → conclusion about the group is valid.",
            "timeTarget": 60
        }
    ],
    "guided_hard": [],
    "independent_hard": [],
    "homework_hard": [],
    "exam_hard": []
};
window.QUESTIONS = QUESTIONS_DATA;

window.PLAYLIST = [
    {
        title: "Statistical Reasoning",
        moduleKey: "guided", 
        introText: "Statistical questions test your ability to evaluate if a conclusion can be drawn from a sample to a population. Always check if the sample was random.",
        questions: {
            "guided": QUESTIONS_DATA.guided,
            "independent": QUESTIONS_DATA.independent,
            "homework": QUESTIONS_DATA.homework,
            "exam": QUESTIONS_DATA.exam
        }
    }
];
