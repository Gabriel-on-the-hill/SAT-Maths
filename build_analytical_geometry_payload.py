import json
import random
import os

def build_payload():
    # Load both JSONs
    with open('Analytical_Geometry_Circles/snapshot_questions.json', 'r') as f:
        data1 = json.load(f)
    with open('Analytical_Geometry_Trig/snapshot_questions.json', 'r') as f:
        data2 = json.load(f)
    
    all_qs = data1 + data2
    
    # Clean paths
    for q in all_qs:
        q['question_image'] = 'assets/' + os.path.basename(q['question_image'])
        q['skill'] = "Analytical Geometry & Trig"

    # Separate by difficulty
    easy_pool = [q for q in all_qs if q['difficulty'] == 'Easy']
    medium_pool = [q for q in all_qs if q['difficulty'] == 'Medium']
    hard_pool = [q for q in all_qs if q['difficulty'] == 'Hard']

    random.shuffle(easy_pool)
    random.shuffle(medium_pool)
    random.shuffle(hard_pool)

    # Playlist Allocation
    def get_set(count_e, count_m, count_h):
        result = []
        for _ in range(count_e): 
            if easy_pool: result.append(easy_pool.pop())
        for _ in range(count_m): 
            if medium_pool: result.append(medium_pool.pop())
        for _ in range(count_h): 
            if hard_pool: result.append(hard_pool.pop())
        random.shuffle(result)
        return result

    playlist = {
        "guided": get_set(3, 4, 3),
        "independent": get_set(3, 4, 3),
        "homework": get_set(3, 4, 3),
        "exam": get_set(4, 7, 4),
        "additional": easy_pool + medium_pool + hard_pool
    }

    # Format as JS
    output = f"const PLAYLIST = {json.dumps(playlist, indent=4)};\nwindow.PLAYLIST = PLAYLIST;"
    
    with open('Analytical_Geometry_App/data/questions.js', 'w') as f:
        f.write(output)
    
    print(f"Payload built. Total questions: {len(all_qs)}")
    print(f"Leftovers in additional: {len(playlist['additional'])}")

if __name__ == '__main__':
    build_payload()
