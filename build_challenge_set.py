#!/usr/bin/env python3
"""Per-student Challenge Set generator for Edutrack Math.
Selects hard, multi-concept questions anchored on a student's real-miss
archetypes and emits them into the single Challenge_App as data/<key>.js
(+ roster manifest + assets), keeping each question's source app so mastery
links back to the home module. Config-driven, transferable across apps/students.
Usage: python3 build_challenge_set.py [studentkey ...]
"""
import os, re, json, sys, shutil, time
from collections import defaultdict

try:
    import json5
except ImportError:
    json5 = None

def _loads(s):
    try:
        return json.loads(s)
    except Exception:
        if json5 is None: raise
        return json5.loads(s)

ROOT = os.path.dirname(os.path.abspath(__file__))
CHALLENGE_APP = "Challenge_App"
BASELINE_DIFFICULTY = {"hard"}
PLAYLIST_KEYS = ["guided", "independent", "homework", "exam", "additional"]

SOURCE_APPS = {
    "Linear_Equations_App":           "Algebra",
    "Linear_Functions_App":           "Algebra",
    "Nonlinear_Functions_App":        "Advanced Math",
    "Systems_and_Expressions_App_v2": "Advanced Math",
    "Proportionality_App":            "Problem-Solving and Data Analysis",
    "Statistical_Reasoning_App":      "Problem-Solving and Data Analysis",
    "Data_Analysis_Probability_App":  "Problem-Solving and Data Analysis",
    "Core_Geometry_App":              "Geometry and Trigonometry",
    "Analytical_Geometry_App":        "Geometry and Trigonometry",
}

# NOTE: no passwords here. A student's roster key is simply their display name
# lowercased, which is what the app looks up (MathGate.currentName().toLowerCase()).
# Logins live in shared/gate.js as SHA-256 hashes; keep plaintext out of this repo,
# which is the public site.
STUDENTS = {
    # Jeffrey's set is pinned rather than seed-generated. Seeds pick the highest-
    # ranked hard item in an archetype, which is not the same as picking the item
    # that matches the miss; every id below is chosen against a recorded miss or a
    # hard-module family with no coverage at all. Seeds are kept as the fallback
    # for a future rebuild that raises `target` and wants siblings from the same
    # families -- they do not fire while len(force_ids) >= target.
    # Rebuilt 30 August 2026; the 21 August set is retired to _archive/. Every
    # item in that set had been served once, so it could no longer distinguish a
    # method that works from a worked example remembered. The archetype families
    # below are unchanged -- only the items are new, drawn as unseen siblings
    # from the same pools. No id here appears in the retired set.
    "jeffrey": {
        "display": "Jeffrey",
        "seeds": ["vertex form", "line meets parabola", "exponential",
                  "sohcahtoa", "random sample", "percent in a real-world",
                  "interpret slope", "slope-intercept", "median",
                  "number of solutions"],
        "force_ids": [
            # Advanced Math -- the heaviest domain on the section. Vertex form
            # and line-meets-parabola had no unseen items left on this key.
            "bba18ecb", "7eed640d", "84e8cc72", "ebed7dc6",   # quadratic in vertex form
            "2c5c22d0", "e9349667", "7dbd46d9", "30281058",   # system: line meets parabola
            "43926bd9", "ce579859", "263f9937",               # exponential growth or decay
            "466b87e3",                                       # number of solutions
            # Geometry and Trigonometry -- the complementary-angle identity,
            # sin(x) = cos(90 - x). Four unseen siblings.
            "6ab30ce3", "0e709a29", "a67b9f88", "1429dcdf",   # right triangle trig
            # Algebra -- a rate read against a starting value: the linear half
            # of the modelling families.
            "b988eeec", "16889ef3",                           # interpret slope or intercept
            "0b0fa68b", "023c0a8d",                           # slope-intercept form
            "e1248a5c",                                       # number of solutions
            # Problem-Solving and Data Analysis -- what a random sample
            # licenses, and which base a percent is taken against.
            "7ce2830a", "6fca0144", "7d68096f",               # random sample -> generalise
            "4ff597db", "d3b9c8d8",                           # mean, median, mode
            "8c5dbd3e", "65c49824",                           # percent in a real-world context
        ],
        "per_seed": 4, "target": 28,
    },
}

def roster_key(cfg):
    """The key the app looks the student up by: MathGate.currentName().toLowerCase()."""
    return cfg["display"].strip().lower()

def extract_value(path):
    txt = open(path, encoding="utf-8", errors="ignore").read()
    eq = txt.find("=")
    if eq < 0: return None
    i = None
    for j in range(eq+1, len(txt)):
        if txt[j] in "{[": i = j; break
    if i is None: return None
    depth=0; instr=False; esc=False; q=None
    for j in range(i, len(txt)):
        c=txt[j]
        if instr:
            if esc: esc=False
            elif c=="\\": esc=True
            elif c==q: instr=False
        else:
            if c in "\"'": instr=True; q=c
            elif c in "{[": depth+=1
            elif c in "}]":
                depth-=1
                if depth==0: return _loads(txt[i:j+1])
    return None

QFIELDS = ("difficulty","archetype","question_image","question")
def collect_questions(node, out):
    if isinstance(node, dict):
        if "id" in node and any(k in node for k in QFIELDS):
            out.append(node); return
        for v in node.values(): collect_questions(v, out)
    elif isinstance(node, list):
        for v in node: collect_questions(v, out)

def load_all_questions():
    seen = {}
    for app, domain in SOURCE_APPS.items():
        p = os.path.join(ROOT, app, "data", "questions.js")
        if not os.path.exists(p):
            print("  ! missing", p); continue
        qs = []; collect_questions(extract_value(p), qs)
        for qq in qs:
            if not isinstance(qq, dict) or "id" not in qq or qq["id"] in seen: continue
            d = dict(qq); d["_app"] = app; d["_domain"] = domain
            seen[qq["id"]] = d
    return list(seen.values())

def select_for_student(cfg, pool):
    seeds = [s.lower() for s in cfg.get("seeds", [])]
    per_seed = cfg.get("per_seed", 4); target = cfg.get("target", 28)
    force_ids = set(cfg.get("force_ids", []))
    by_id = {q["id"]: q for q in pool}; chosen = {}
    for fid in force_ids:
        if fid in by_id: chosen[fid] = by_id[fid]
    hard = [q for q in pool if str(q.get("difficulty","")).lower() in BASELINE_DIFFICULTY]
    def matched_seed(q):
        a = str(q.get("archetype","")).lower()
        for s in seeds:
            if s in a: return s
        return None
    buckets = defaultdict(list)
    for q in hard:
        s = matched_seed(q)
        if s: buckets[s].append(q)
    def rank_key(q): return (0 if q.get("trapName") else 1, -int(q.get("timeTarget") or 0))
    for b in buckets: buckets[b].sort(key=rank_key)
    dcount = defaultdict(int); picked = defaultdict(int); go = True
    while len(chosen) < target and go:
        go = False
        for s in seeds:
            if s not in buckets or picked[s] >= per_seed: continue
            cand = [q for q in buckets[s] if q["id"] not in chosen]
            if not cand: continue
            cand.sort(key=lambda q: (dcount[q["_domain"]], rank_key(q)))
            q = cand[0]; chosen[q["id"]] = q
            picked[s] += 1; dcount[q["_domain"]] += 1; go = True
            if len(chosen) >= target: break
    return list(chosen.values())

def clean_q(q):
    return {k: v for k, v in q.items() if not k.startswith("_")}

def asset_path(q):
    if q.get("question_image"): return q["question_image"]
    m = re.search(r'src="([^"]+)"', q.get("question","") or "")
    return m.group(1) if m else None

def existing_stamps(out_dir, key):
    """addedAt for questions already in this student's set, from the last build.

    Carrying these forward is what lets a rebuild add questions without
    disturbing the ones the student is part-way through: an unchanged question
    keeps its stamp, so its earned credit still counts. A question that is NOT
    in the current file -- new, or dropped and re-added after another Bluebook
    miss -- gets a fresh stamp below, which makes the app treat it as new again.
    """
    path = os.path.join(out_dir, "data", "%s.js" % key)
    if not os.path.exists(path):
        return {}
    try:
        playlist = extract_value(path) or {}
    except Exception:
        return {}
    qs = []
    collect_questions(playlist, qs)
    return {q["id"]: q["addedAt"] for q in qs
            if isinstance(q, dict) and q.get("id") and isinstance(q.get("addedAt"), int)}

def write_challenge_module(cfg, selected):
    key = roster_key(cfg)
    out_dir = os.path.join(ROOT, CHALLENGE_APP)
    os.makedirs(os.path.join(out_dir, "assets"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "data"), exist_ok=True)
    copied = 0
    for q in selected:
        img = asset_path(q)
        if not img or not img.startswith("assets/"): continue
        src = os.path.join(ROOT, q["_app"], img); dst = os.path.join(out_dir, img)
        if os.path.exists(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst); copied += 1
    prev = existing_stamps(out_dir, key)
    now_ms = int(time.time() * 1000)
    clean = [dict(clean_q(q), app=q["_app"], domain=q["_domain"],
                  addedAt=prev.get(q["id"], now_ms)) for q in selected]
    fresh = sum(1 for q in selected if q["id"] not in prev)
    playlist = {k: clean for k in PLAYLIST_KEYS}
    open(os.path.join(out_dir, "data", "%s.js" % key), "w", encoding="utf-8").write(
        "var PLAYLIST = " + json.dumps(playlist, ensure_ascii=False, indent=2) + ";\n")
    roster = {}
    for fn in sorted(os.listdir(os.path.join(out_dir, "data"))):
        if fn.endswith(".js") and fn != "manifest.js":
            roster[fn[:-3]] = "data/" + fn
    open(os.path.join(out_dir, "data", "manifest.js"), "w", encoding="utf-8").write(
        "window.CHALLENGE_ROSTER = " + json.dumps(roster) + ";\n")
    return CHALLENGE_APP, copied, fresh, len(selected) - fresh

def write_shortlist(cfg, selected):
    name = cfg["display"]
    rows = sorted(selected, key=lambda q: (q["_domain"], str(q.get("archetype"))))
    L = ["# %s — Challenge Set review shortlist" % name, "",
         "Auto-selected **%d** questions. Cut any that aren't the intended type." % len(selected), "",
         "| keep | id | domain | difficulty | archetype | trap | time |",
         "|:---:|----|--------|:----------:|-----------|------|:---:|"]
    for q in rows:
        L.append("| [ ] | %s | %s | %s | %s | %s | %s |" % (
            q["id"], q["_domain"], q.get("difficulty",""), q.get("archetype",""),
            q.get("trapName","") or "", q.get("timeTarget","")))
    by = defaultdict(int)
    for q in selected: by[q["_domain"]] += 1
    L += ["", "## Spread by domain"] + ["- %s: %d" % (d,c) for d,c in sorted(by.items())]
    path = os.path.join(ROOT, "challenge_shortlist_%s.md" % roster_key(cfg))
    open(path, "w", encoding="utf-8").write("\n".join(L))
    return path

def build_student(skey):
    cfg = STUDENTS[skey]; pool = load_all_questions()
    selected = select_for_student(cfg, pool)
    out_app, copied, fresh, kept = write_challenge_module(cfg, selected)
    sl = write_shortlist(cfg, selected)
    dom = defaultdict(int)
    for q in selected: dom[q["_domain"]] += 1
    print("\n=== %s ===" % cfg["display"])
    print("  pool size     :", len(pool))
    print("  selected      :", len(selected))
    print("  newly stamped :", fresh, "(served as new)")
    print("  carried over  :", kept, "(progress kept)")
    print("  assets copied :", copied)
    print("  data file     : %s/data/%s.js" % (out_app, roster_key(cfg)))
    print("  by domain     : " + ", ".join("%s=%d" % (d,c) for d,c in sorted(dom.items())))

if __name__ == "__main__":
    for k in (sys.argv[1:] or list(STUDENTS.keys())):
        if k not in STUDENTS: print("unknown student", k); continue
        build_student(k)
