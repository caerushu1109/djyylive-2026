#!/usr/bin/env python3
"""Translate club names to Chinese using GPT, then patch squad JSON files."""
import json, glob, re, urllib.request, os
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
CLUB_ZH_PATH = PROJECT / "lib" / "club-names-zh.json"

def collect_clubs():
    clubs = set()
    for f in sorted(glob.glob(str(PROJECT / "public/data/squads/*.json"))):
        with open(f) as fh:
            data = json.load(fh)
        players = data if isinstance(data, list) else data.get("players", [])
        for p in players:
            c = p.get("club", "")
            if c: clubs.add(c)
    return sorted(clubs)

def load_existing():
    if CLUB_ZH_PATH.exists():
        with open(CLUB_ZH_PATH) as f:
            return json.load(f)
    return {}

def call_gpt(names):
    names_text = "\n".join(names)
    prompt = f"""你是资深足球翻译编辑。将以下足球俱乐部名翻译成中文。

要求：
1. 知名俱乐部用公认中文名（如 Real Madrid → 皇家马德里，Manchester United → 曼联，Barcelona → 巴塞罗那，Bayern Munich → 拜仁慕尼黑）
2. 五大联赛球队必须用中国球迷最常用的简称（如 Liverpool → 利物浦，Chelsea → 切尔西，Juventus → 尤文图斯）
3. 中东/非洲/亚洲/小联赛球队直接音译
4. 只输出 JSON，key=英文，value=中文
5. 不要 markdown 代码块

俱乐部名单：
{names_text}"""

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4000, "temperature": 0.1,
    })
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_API_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    usage = result.get("usage", {})
    cost = (usage.get("prompt_tokens",0)*0.15 + usage.get("completion_tokens",0)*0.60)/1_000_000
    print(f"    ${cost:.4f}")
    content = result["choices"][0]["message"]["content"].strip()
    content = re.sub(r'^```json\s*', '', content)
    content = re.sub(r'\s*```$', '', content)
    return json.loads(content)

def main():
    if not OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY not set"); return

    print("=== Club Name Translator ===\n")
    clubs = collect_clubs()
    existing = load_existing()
    missing = [c for c in clubs if c not in existing]
    print(f"Total clubs: {len(clubs)}, existing: {len(existing)}, missing: {len(missing)}")

    if not missing:
        print("Nothing to translate!"); return

    BATCH = 80
    new_trans = {}
    total_b = (len(missing)+BATCH-1)//BATCH
    for i in range(0, len(missing), BATCH):
        batch = missing[i:i+BATCH]
        print(f"  Batch {i//BATCH+1}/{total_b} ({len(batch)})...")
        try:
            r = call_gpt(batch)
            new_trans.update(r)
            print(f"    Got {len(r)}")
        except Exception as e:
            print(f"    ERROR: {e}")

    merged = {**existing, **new_trans}
    with open(CLUB_ZH_PATH, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(merged)} club translations to {CLUB_ZH_PATH}")

    # Patch squad files
    print("\nPatching squad files...")
    patched = 0
    for fp in sorted(glob.glob(str(PROJECT / "public/data/squads/*.json"))):
        with open(fp) as fh:
            data = json.load(fh)
        players = data if isinstance(data, list) else data.get("players", [])
        changed = False
        for p in players:
            club = p.get("club", "")
            if club and club in merged:
                zh = merged[club]
                if p.get("clubZh") != zh:
                    p["clubZh"] = zh
                    changed = True
        if changed:
            with open(fp, "w", encoding="utf-8") as fh:
                json.dump(data, fh, ensure_ascii=False, indent=2)
            patched += 1
    print(f"  Patched {patched} squad files")
    print("\n=== Done ===")

if __name__ == "__main__":
    main()
