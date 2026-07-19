import json
import random
import os

# Create Proportionality App folders
os.makedirs("Proportionality_App/data", exist_ok=True)

# Load the generated snapshots
snapshots = []
for filename in ["Proportionality_App/percentages.json", "Proportionality_App/ratios.json"]:
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
# Bronze Tier requirements per topic (we have ~68 questions total here)
# Target per module: 10 Qs. 
# Guided: 3E, 4M, 3H
# Independent: 1E, 4M, 5H
# Homework: 2E, 4M, 4H
# Exam: 2E, 4M, 4H
# Hard Mode variations shift the curve up.

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

# We originally had Hard Sets consuming the rest of the pool, preventing an Additional pool.
# I'm removing the Hard Sets since the UI doesn't explicitly have buttons to launch a "Hard" guided practice anyway.
# This ensures we have a healthy "Additional Practice" surplus for the student.

# Whatever is left over goes to additional practice
additional = easy_qs + medium_qs + hard_qs

# Format for JS App
def format_for_app(q_list):
    formatted = []
    for q in q_list:
        # Construct the explanation HTML based on the framework
        exp_html = ""
        # If the app had a specific Desmos strategy extracted, use it. Otherwise fallback.
        if q.get("desmos_strategy"):
            exp_html += f"<strong>Desmos Strategy:</strong> {q['desmos_strategy']}<br><br>"
        else:
            exp_html += "<strong>SAT Strategy:</strong> Read carefully and set up the proportion.<br><br>"
            
        exp_html += f"<strong>Algebraic Method:</strong> {q['explanation']}<br><br>"
        exp_html += "<strong>🪤 Trap Alert:</strong> Ensure units match before multiplying."
        
        # Build options array. The JSON extraction might not have options text, 
        # but the UI needs 4 options for the A,B,C,D buttons.
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
    "additional": format_for_app(additional)
}

# Add concepts playlist 
js_content = "const QUESTIONS_DATA = " + json.dumps(payload, indent=4) + ";\n"
js_content += "window.QUESTIONS = QUESTIONS_DATA;\n"
js_content += """
window.PLAYLIST = [
    {
        title: "Proportionality & Percentages",
        moduleKey: "guided", 
        introText: "Most percentage and ratio questions can be solved by setting up a fraction. Part / Whole = Part / Whole.",
        questions: {
            "guided": QUESTIONS_DATA.guided,
            "independent": QUESTIONS_DATA.independent,
            "homework": QUESTIONS_DATA.homework,
            "exam": QUESTIONS_DATA.exam,
            "additional": QUESTIONS_DATA.additional
        }
    }
];
"""

with open("Proportionality_App/data/questions.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Generated Proportionality payload with {sum(len(v) for v in payload.values())} questions allocated.")
