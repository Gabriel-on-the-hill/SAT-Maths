import json
import os
import shutil
import random

# Configuration
APP_DIR = "Linear_Functions_App"
DEST_ASSETS_DIR = os.path.join(APP_DIR, "assets")
os.makedirs(DEST_ASSETS_DIR, exist_ok=True)

TOPICS = [
    {
        "id": "linear_functions",
        "title": "Linear Functions",
        "folder": "SAT Linear Functions",
        "intro": "<strong>Strategy:</strong> Type the function into Row 1 of Desmos to visualize the relationship. For slope-intercept form $y = mx + b$, the number in front of $x$ is always the slope."
    },
    {
        "id": "linear_inequalities",
        "title": "Linear Functions in One or Two Variables",
        "folder": "SAT Linear Inequalities",
        "intro": "<strong>Strategy:</strong> Type the inequalities exactly as written into Desmos. For systems of inequalities, the solution set is the region where the shading overlaps. Look for the darkest area! Test points (x, y) to verify."
    }
]

def format_q(q):
    return {
        "id": q["id"],
        "question": f'<img src="{q["question_image"]}" class="full-q-image" alt="Question Image">',
        "options": [], 
        "answer": q["answer"] if q["answer"] else "",
        "correctIndex": ["A", "B", "C", "D"].index(q["answer"]) if q["answer"] in ["A", "B", "C", "D"] else -1,
        "explanation": f"<strong>Rationale:</strong><br>{q['explanation']}",
        "difficulty": q["difficulty"],
        "type": q["type"]
    }

def process_topic(topic_config):
    folder = topic_config["folder"]
    manifest_path = os.path.join(folder, "snapshot_questions.json")
    
    if not os.path.exists(manifest_path):
        print(f"Error: Manifest not found for {folder}")
        return None
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        questions_data = json.load(f)
        
    print(f"--- Processing {topic_config['title']} ({len(questions_data)} questions) ---")
    
    # Copy Assets
    src_assets = os.path.join(folder, "assets")
    for q in questions_data:
        img_name = os.path.basename(q["question_image"])
        src_img = os.path.join(src_assets, img_name)
        dest_img = os.path.join(DEST_ASSETS_DIR, img_name)
        if os.path.exists(src_img):
            shutil.copy2(src_img, dest_img)
            
    # Shuffle pools for randomness at build-time
    easy_qs = [q for q in questions_data if q["difficulty"] == "Easy"]
    med_qs = [q for q in questions_data if q["difficulty"] == "Medium"]
    hard_qs = [q for q in questions_data if q["difficulty"] == "Hard"]
    
    random.shuffle(easy_qs)
    random.shuffle(med_qs)
    random.shuffle(hard_qs)
    
    sections = {"guided": [], "independent": [], "homework": [], "exam": []}
    
    def build_section(target_easy=3, target_med=4, target_hard=3):
        section_qs = []
        
        # Helper to safely pull from a pool
        def pull_qs(pool, count):
            pulled = []
            while len(pulled) < count and pool:
                pulled.append(pool.pop(0))
            return pulled
            
        # Try to meet the ideal target
        e_pulled = pull_qs(easy_qs, target_easy)
        m_pulled = pull_qs(med_qs, target_med)
        h_pulled = pull_qs(hard_qs, target_hard)
        
        section_qs.extend(e_pulled + m_pulled + h_pulled)
        
        # Adaptive Fallback: If we didn't hit 10, fill with whatever is left
        shortage = 10 - len(section_qs)
        if shortage > 0:
            # Try to grab more mediums, then easy, then hard to fill the gap
            extra_m = pull_qs(med_qs, shortage)
            section_qs.extend(extra_m)
            shortage = 10 - len(section_qs)
            
            if shortage > 0:
                extra_e = pull_qs(easy_qs, shortage)
                section_qs.extend(extra_e)
                shortage = 10 - len(section_qs)
                
            if shortage > 0:
                extra_h = pull_qs(hard_qs, shortage)
                section_qs.extend(extra_h)
                
        random.shuffle(section_qs) # Mix difficulties so it's not strictly E->M->H
        return section_qs
        
    sections["guided"] = build_section()
    sections["independent"] = build_section()
    sections["homework"] = build_section()
    sections["exam"] = build_section()
    
    # Leftover questions go to additional
    additional_qs = easy_qs + med_qs + hard_qs
    
    return {
        "id": topic_config["id"],
        "title": topic_config["title"],
        "introText": topic_config["intro"],
        "questions": {
            "guided": [format_q(q) for q in sections["guided"][:10]],
            "independent": [format_q(q) for q in sections["independent"][:10]],
            "homework": [format_q(q) for q in sections["homework"][:10]],
            "exam": [format_q(q) for q in sections["exam"][:10]],
            "additional": [format_q(q) for q in additional_qs]
        }
    }

playlist_payload = []
for t in TOPICS:
    res = process_topic(t)
    if res:
        playlist_payload.append(res)

# Write to questions.js
output_js = f"window.PLAYLIST = {json.dumps(playlist_payload, indent=4)};\n"
output_path = os.path.join(APP_DIR, "data", "questions.js")

with open(output_path, "w", encoding="utf-8") as f:
    f.write(output_js)

print(f"\nSuccessfully wrote Playlist with {len(playlist_payload)} topics to {output_path}")
