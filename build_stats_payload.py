import json
import random
import os

# Create Statistical Reasoning App folders
os.makedirs("Statistical_Reasoning_App/data", exist_ok=True)

# Load the generated snapshots
snapshots = []
for filename in ["Statistical_Reasoning_App/claims.json", "Statistical_Reasoning_App/inference.json"]:
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            snapshots.extend(json.load(f))
    else:
        print(f"Warning: {filename} not found.")

# Sort into difficulty buckets
easy_qs = [q for q in snapshots if q["difficulty"].lower() == "easy"]
medium_qs = [q for q in snapshots if q["difficulty"].lower() == "medium"]
hard_qs = [q for q in snapshots if q["difficulty"].lower() == "hard"]

random.seed(42) # For reproducible builds
random.shuffle(easy_qs)
random.shuffle(medium_qs)
random.shuffle(hard_qs)

# --- Allocation Logic ---
def draw_questions(pool, count):
    drawn = []
    for _ in range(count):
        if pool:
            drawn.append(pool.pop(0))
    return drawn

# Standard Sets
guided = draw_questions(easy_qs, 3) + draw_questions(medium_qs, 4) + draw_questions(hard_qs, 3)
independent = draw_questions(easy_qs, 1) + draw_questions(medium_qs, 4) + draw_questions(hard_qs, 3)
homework = draw_questions(easy_qs, 2) + draw_questions(medium_qs, 4) + draw_questions(hard_qs, 4)
exam = draw_questions(easy_qs, 2) + draw_questions(medium_qs, 4) + draw_questions(hard_qs, 4)

# Hard Sets
guided_hard = draw_questions(easy_qs, 0) + draw_questions(medium_qs, 2) + draw_questions(hard_qs, 8)
independent_hard = draw_questions(easy_qs, 0) + draw_questions(medium_qs, 1) + draw_questions(hard_qs, 7)
homework_hard = draw_questions(easy_qs, 0) + draw_questions(medium_qs, 2) + draw_questions(hard_qs, 8)
exam_hard = draw_questions(easy_qs, 0) + draw_questions(medium_qs, 2) + draw_questions(hard_qs, 8)

# Format for JS App
def format_for_app(q_list):
    formatted = []
    for q in q_list:
        exp_html = ""
        if q.get("desmos_strategy"):
            exp_html += f"<strong>Desmos Strategy:</strong> {q['desmos_strategy']}<br><br>"
        else:
            exp_html += "<strong>SAT Strategy:</strong> Read the claim carefully. Does the sample represent the population?<br><br>"
            
        exp_html += f"<strong>Algebraic Method:</strong> {q['explanation']}<br><br>"
        exp_html += "<strong>🪤 Trap Alert:</strong> Beware of biased samples or small sample sizes."
        
        options = ["A", "B", "C", "D"]
        correct_idx = 0
        if q["answer"] in ["A", "B", "C", "D"]:
            correct_idx = ord(q["answer"]) - 65
        
        formatted.append({
            "id": q["id"],
            "difficulty": q["difficulty"],
            "question": f'<img src="{q["question_image"]}" class="question-img" alt="Question">',
            "options": options,
            "correctIndex": correct_idx,
            "answer": q.get("answer", ""),  # preserve for grid-in scoring
            "explanation": exp_html,
            "type": q["type"]
        })
    return formatted

# Build Final Payload
payload = {
    "guided": format_for_app(guided),
    "independent": format_for_app(independent),
    "homework": format_for_app(homework),
    "exam": format_for_app(exam),
    "guided_hard": format_for_app(guided_hard),
    "independent_hard": format_for_app(independent_hard),
    "homework_hard": format_for_app(homework_hard),
    "exam_hard": format_for_app(exam_hard)
}

js_content = "const QUESTIONS_DATA = " + json.dumps(payload, indent=4) + ";\n"
js_content += "window.QUESTIONS = QUESTIONS_DATA;\n"
js_content += """
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
"""

with open("Statistical_Reasoning_App/data/questions.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Generated Statistical Reasoning payload with {sum(len(v) for v in payload.values())} questions allocated.")
