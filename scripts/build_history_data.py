#!/usr/bin/env python3
"""
Download jfjelstul/worldcup CSVs and build compact JSON for the history museum.
Output: public/data/history/*.json
"""
import csv, json, io, os, urllib.request
from collections import defaultdict

BASE = "https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv"
OUT  = os.path.join(os.path.dirname(__file__), "..", "public", "data", "history")

def fetch_csv(name):
    url = f"{BASE}/{name}.csv"
    print(f"  Fetching {name}.csv ...")
    with urllib.request.urlopen(url) as r:
        text = r.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(text)))

# ── Team name translations ──────────────────────────────────────────
TEAM_ZH = {
    "Argentina":"阿根廷","Australia":"澳大利亚","Austria":"奥地利","Belgium":"比利时",
    "Bolivia":"玻利维亚","Bosnia and Herzegovina":"波黑","Brazil":"巴西","Bulgaria":"保加利亚",
    "Cameroon":"喀麦隆","Canada":"加拿大","Chile":"智利","China PR":"中国",
    "Colombia":"哥伦比亚","Costa Rica":"哥斯达黎加","Croatia":"克罗地亚","Cuba":"古巴",
    "Czech Republic":"捷克","Czechoslovakia":"捷克斯洛伐克","Denmark":"丹麦",
    "Dutch East Indies":"荷属东印度","Ecuador":"厄瓜多尔","Egypt":"埃及",
    "El Salvador":"萨尔瓦多","England":"英格兰","France":"法国","Germany":"德国",
    "Germany FR":"西德","Germany DR":"东德","Ghana":"加纳","Greece":"希腊",
    "Haiti":"海地","Honduras":"洪都拉斯","Hungary":"匈牙利","Iceland":"冰岛",
    "Indonesia":"印度尼西亚","Iran":"伊朗","Iraq":"伊拉克","Ireland":"爱尔兰",
    "Israel":"以色列","Italy":"意大利","Ivory Coast":"科特迪瓦","Jamaica":"牙买加",
    "Japan":"日本","Kuwait":"科威特","Mexico":"墨西哥","Morocco":"摩洛哥",
    "Netherlands":"荷兰","New Zealand":"新西兰","Nigeria":"尼日利亚","North Korea":"朝鲜",
    "Northern Ireland":"北爱尔兰","Norway":"挪威","Panama":"巴拿马","Paraguay":"巴拉圭",
    "Peru":"秘鲁","Poland":"波兰","Portugal":"葡萄牙","Qatar":"卡塔尔",
    "Romania":"罗马尼亚","Russia":"俄罗斯","Saudi Arabia":"沙特","Scotland":"苏格兰",
    "Senegal":"塞内加尔","Serbia":"塞尔维亚","Serbia and Montenegro":"塞黑",
    "Slovakia":"斯洛伐克","Slovenia":"斯洛文尼亚","South Africa":"南非",
    "South Korea":"韩国","Soviet Union":"苏联","Spain":"西班牙","Sweden":"瑞典",
    "Switzerland":"瑞士","Togo":"多哥","Trinidad and Tobago":"特立尼达和多巴哥",
    "Tunisia":"突尼斯","Turkey":"土耳其","Ukraine":"乌克兰",
    "United Arab Emirates":"阿联酋","United States":"美国","Uruguay":"乌拉圭",
    "Wales":"威尔士","Yugoslavia":"南斯拉夫","Zaire":"扎伊尔",
    "Algeria":"阿尔及利亚","Angola":"安哥拉","Republic of Ireland":"爱尔兰",
    "Serbia and Montenegro":"塞黑","FR Yugoslavia":"南联盟",
    "Korea Republic":"韩国","Korea DPR":"朝鲜","IR Iran":"伊朗",
    "Côte d'Ivoire":"科特迪瓦","Congo DR":"刚果(金)",
    "Trinidad & Tobago":"特多","Chinese Taipei":"中华台北",
    "USA":"美国","USSR":"苏联","West Germany":"西德","East Germany":"东德",
}

HOST_ZH = {
    "Uruguay":"乌拉圭","Italy":"意大利","France":"法国","Brazil":"巴西",
    "Switzerland":"瑞士","Sweden":"瑞典","Chile":"智利","England":"英格兰",
    "Mexico":"墨西哥","Germany":"德国","Argentina":"阿根廷","Spain":"西班牙",
    "United States":"美国","South Korea":"韩国","Japan":"日本",
    "South Africa":"南非","Russia":"俄罗斯","Qatar":"卡塔尔",
    "Germany FR":"西德","West Germany":"西德",
}

def zh(name):
    return TEAM_ZH.get(name, name)

def player_name(row):
    """Build player display name, filtering 'not applicable' placeholders."""
    given = row.get("given_name", "") or ""
    family = row.get("family_name", "") or ""
    if given.lower() in ("not applicable", "n/a", ""):
        return family
    if family.lower() in ("not applicable", "n/a", ""):
        return given
    return f"{given} {family}".strip()

def host_zh(name):
    return HOST_ZH.get(name, TEAM_ZH.get(name, name))

# ════════════════════════════════════════════════════════════════════
print("=== Building World Cup History Data ===\n")

tournaments = fetch_csv("tournaments")
matches     = fetch_csv("matches")
goals       = fetch_csv("goals")
standings   = fetch_csv("tournament_standings")
awards      = fetch_csv("award_winners")
team_apps   = fetch_csv("team_appearances")
penalties   = fetch_csv("penalty_kicks")
qualified   = fetch_csv("qualified_teams")
player_apps = fetch_csv("player_appearances")

# Filter men's only
men_tournaments = [t for t in tournaments if "Women" not in t.get("tournament_name","")]
men_ids = {t["tournament_id"] for t in men_tournaments}
men_matches = [m for m in matches if m["tournament_id"] in men_ids]
men_goals   = [g for g in goals if g["tournament_id"] in men_ids]
men_apps    = [a for a in team_apps if a["tournament_id"] in men_ids]
men_pens    = [p for p in penalties if p["tournament_id"] in men_ids]
men_awards  = [a for a in awards if a["tournament_id"] in men_ids]
men_standings = [s for s in standings if s["tournament_id"] in men_ids]
men_player_apps = [a for a in player_apps if a["tournament_id"] in men_ids]

# Build player → tournament appearances (for accurate tournament count)
player_tournament_apps = defaultdict(set)
for a in men_player_apps:
    pid = a.get("player_id", "")
    tid = a.get("tournament_id", "")
    if pid and tid:
        player_tournament_apps[pid].add(tid)
men_qualified = [q for q in qualified if q["tournament_id"] in men_ids]

# ── 1. Champions Timeline ──────────────────────────────────────────
print("Building champions.json ...")
finals_map = {}
for m in men_matches:
    stage = m.get("stage_name","")
    if "final" in stage.lower() and "semi" not in stage.lower() and "quarter" not in stage.lower() and "third" not in stage.lower():
        tid = m["tournament_id"]
        # Pick the actual Final (not replays unless only replay exists)
        if tid not in finals_map or m.get("replay") != "1":
            finals_map[tid] = m

# Build standings lookup: tournament_id → {position → team}
standings_map = defaultdict(dict)
for s in men_standings:
    try:
        pos = int(s["position"])
    except (ValueError, KeyError):
        continue
    standings_map[s["tournament_id"]][pos] = s["team_name"]

champions = []
for t in sorted(men_tournaments, key=lambda x: int(x["year"])):
    tid = t["tournament_id"]
    year = int(t["year"])
    final = finals_map.get(tid)
    winner = t.get("winner", "")
    runner_up = standings_map.get(tid, {}).get(2, "")
    third = standings_map.get(tid, {}).get(3, "")

    score = ""
    pens = ""
    if final:
        hs = final.get("home_team_score","")
        aws = final.get("away_team_score","")
        if hs and aws:
            score = f"{hs}-{aws}"
        if final.get("penalty_shootout") == "1":
            ps = final.get("home_team_score_penalties","")
            pa = final.get("away_team_score_penalties","")
            if ps and pa:
                pens = f"{ps}-{pa}"
        elif final.get("extra_time") == "1":
            pens = "加时"

    num_teams = int(t.get("count_teams",0)) if t.get("count_teams") else 0

    champions.append({
        "year": year,
        "host": host_zh(t.get("host_country","")),
        "winner": zh(winner),
        "runnerUp": zh(runner_up),
        "third": zh(third),
        "score": score,
        "extra": pens,
        "teams": num_teams,
    })

# Title count
title_count = defaultdict(int)
for c in champions:
    if c["winner"]:
        title_count[c["winner"]] += 1
title_ranking = sorted(title_count.items(), key=lambda x: -x[1])

champions_data = {"timeline": champions, "titleRanking": [{"team":t,"count":c} for t,c in title_ranking]}

# ── 2. All-time Top Scorers ────────────────────────────────────────
print("Building scorers.json ...")
player_goals = defaultdict(lambda: {"goals":0,"ownGoals":0,"penalties":0,"tournaments":set(),"team":""})
for g in men_goals:
    pid = g["player_id"]
    if g.get("own_goal") == "1":
        player_goals[pid]["ownGoals"] += 1
        continue
    player_goals[pid]["goals"] += 1
    if g.get("penalty") == "1":
        player_goals[pid]["penalties"] += 1
    player_goals[pid]["tournaments"].add(g["tournament_id"])
    player_goals[pid]["name"] = player_name(g)
    player_goals[pid]["team"] = g.get("team_name","")

all_scorers = []
for pid, info in player_goals.items():
    if info["goals"] >= 5:
        # Use the larger of player_appearances vs goals-based tournament count
        # (player_appearances is more accurate for modern players like Messi,
        #  but may be incomplete for historical players like Pelé)
        apps_tournaments = player_tournament_apps.get(pid, set())
        actual_tournaments = apps_tournaments if len(apps_tournaments) >= len(info["tournaments"]) else info["tournaments"]
        year_list = []
        for tid in actual_tournaments:
            for part in tid.split("-"):
                if part.isdigit() and len(part) == 4:
                    year_list.append(int(part))
                    break
        years = sorted(year_list) if year_list else [0]
        all_scorers.append({
            "name": info["name"],
            "team": zh(info["team"]),
            "goals": info["goals"],
            "pens": info["penalties"],
            "tournaments": len(actual_tournaments),
            "span": f"{min(years)}-{max(years)}" if len(years) > 1 else str(years[0]),
        })

all_scorers.sort(key=lambda x: -x["goals"])

# Golden Boot winners
golden_boots = []
for a in men_awards:
    if "golden boot" in a.get("award_name","").lower() or "top scorer" in a.get("award_name","").lower():
        year = int(a.get("year", 0)) if a.get("year") else 0
        if not year:
            tid = a.get("tournament_id","")
            try: year = int(tid.replace("WC-",""))
            except: pass
        golden_boots.append({
            "year": year,
            "player": player_name(a),
            "team": zh(a.get("team_name","")),
        })

# Add goal counts to golden boots from goal data
for gb in golden_boots:
    # Find in scorer list
    for s in all_scorers:
        if s["name"] == gb["player"]:
            break

golden_boots.sort(key=lambda x: x["year"])
scorers_data = {"allTime": all_scorers[:50], "goldenBoots": golden_boots}

# ── 3. Team Records ────────────────────────────────────────────────
print("Building teams.json ...")
team_stats = defaultdict(lambda: {"w":0,"d":0,"l":0,"gf":0,"ga":0,"apps":set(),"titles":0,"best":99})
for a in men_apps:
    tid = a["tournament_id"]
    team = a["team_name"]
    team_stats[team]["apps"].add(tid)
    try:
        team_stats[team]["gf"] += int(a.get("goals_for",0))
        team_stats[team]["ga"] += int(a.get("goals_against",0))
    except ValueError:
        pass
    r = a.get("result","")
    if r == "win": team_stats[team]["w"] += 1
    elif r == "draw": team_stats[team]["d"] += 1
    elif r == "lose": team_stats[team]["l"] += 1

# Add title counts and best finish
for s in men_standings:
    team = s["team_name"]
    try:
        pos = int(s["position"])
    except (ValueError, KeyError):
        continue
    if pos < team_stats[team]["best"]:
        team_stats[team]["best"] = pos
    if pos == 1:
        team_stats[team]["titles"] += 1

team_records = []
for team, st in team_stats.items():
    played = st["w"] + st["d"] + st["l"]
    if played < 3:
        continue
    best_labels = {1:"冠军",2:"亚军",3:"季军",4:"第四名"}
    team_records.append({
        "team": zh(team),
        "appearances": len(st["apps"]),
        "p": played, "w": st["w"], "d": st["d"], "l": st["l"],
        "gf": st["gf"], "ga": st["ga"], "gd": st["gf"]-st["ga"],
        "titles": st["titles"],
        "best": best_labels.get(st["best"], f"小组赛") if st["best"] <= 4 else "小组赛",
    })

team_records.sort(key=lambda x: (-x["titles"], -x["appearances"], -x["w"]))
teams_data = team_records[:40]

# ── 4. Records & Superlatives ──────────────────────────────────────
print("Building records.json ...")

# Biggest wins
biggest_wins = []
for m in men_matches:
    try:
        hs = int(m.get("home_team_score",0))
        aws = int(m.get("away_team_score",0))
    except ValueError:
        continue
    diff = abs(hs - aws)
    total = hs + aws
    if diff >= 6 or total >= 9:
        winner = m["home_team_name"] if hs > aws else m["away_team_name"]
        loser = m["away_team_name"] if hs > aws else m["home_team_name"]
        wscore = max(hs,aws)
        lscore = min(hs,aws)
        year = ""
        tid = m["tournament_id"]
        for t in men_tournaments:
            if t["tournament_id"] == tid:
                year = t["year"]
                break
        biggest_wins.append({
            "year": int(year) if year else 0,
            "winner": zh(winner), "loser": zh(loser),
            "score": f"{wscore}-{lscore}",
            "stage": m.get("stage_name",""),
            "diff": diff,
        })
biggest_wins.sort(key=lambda x: -x["diff"])

# Hat tricks (3+ goals by one player in one match)
match_player_goals = defaultdict(lambda: defaultdict(int))
match_player_info = {}
for g in men_goals:
    if g.get("own_goal") == "1":
        continue
    mid = g["match_id"]
    pid = g["player_id"]
    match_player_goals[mid][pid] += 1
    match_player_info[(mid,pid)] = {
        "name": player_name(g),
        "team": g.get("team_name",""),
    }

hat_tricks = []
match_year = {}
for m in men_matches:
    for t in men_tournaments:
        if t["tournament_id"] == m["tournament_id"]:
            match_year[m["match_id"]] = int(t["year"])
            break

for mid, players in match_player_goals.items():
    for pid, cnt in players.items():
        if cnt >= 3:
            info = match_player_info.get((mid,pid),{})
            hat_tricks.append({
                "year": match_year.get(mid, 0),
                "player": info.get("name",""),
                "team": zh(info.get("team","")),
                "goals": cnt,
            })
hat_tricks.sort(key=lambda x: (-x["goals"], x["year"]))

# Penalty shootout stats
ps_matches = [m for m in men_matches if m.get("penalty_shootout") == "1"]
ps_records = []
for m in ps_matches:
    year = match_year.get(m["match_id"], 0)
    home = m["home_team_name"]
    away = m["away_team_name"]
    hp = m.get("home_team_score_penalties","0")
    ap = m.get("away_team_score_penalties","0")
    winner = home if int(hp or 0) > int(ap or 0) else away
    ps_records.append({
        "year": year,
        "teams": f"{zh(home)} vs {zh(away)}",
        "pens": f"{hp}-{ap}",
        "winner": zh(winner),
        "stage": m.get("stage_name",""),
    })
ps_records.sort(key=lambda x: x["year"])

# Fastest goals
fastest = []
for g in men_goals:
    if g.get("own_goal") == "1":
        continue
    try:
        minute = int(g.get("minute_regulation", 999))
    except ValueError:
        continue
    if minute <= 3:
        year = 0
        for t in men_tournaments:
            if t["tournament_id"] == g["tournament_id"]:
                year = int(t["year"])
                break
        fastest.append({
            "year": year,
            "player": player_name(g),
            "team": zh(g.get("team_name","")),
            "minute": minute,
            "vs": zh(g.get("away_team_name","") if g.get("home_team") == "1" else g.get("home_team_name","")),
        })
fastest.sort(key=lambda x: x["minute"])

records_data = {
    "biggestWins": biggest_wins[:15],
    "hatTricks": hat_tricks[:20],
    "penaltyShootouts": ps_records,
    "fastestGoals": fastest[:15],
}

# ── 5. Finals Gallery ──────────────────────────────────────────────
print("Building finals.json ...")
finals_list = []
for t in sorted(men_tournaments, key=lambda x: int(x["year"])):
    tid = t["tournament_id"]
    final = finals_map.get(tid)
    if not final:
        continue
    year = int(t["year"])

    # Get goals in this final
    final_goals = []
    for g in men_goals:
        if g["match_id"] == final["match_id"]:
            final_goals.append({
                "player": player_name(g),
                "team": zh(g.get("team_name","")),
                "minute": g.get("minute_label",""),
                "penalty": g.get("penalty") == "1",
                "ownGoal": g.get("own_goal") == "1",
            })

    home = final["home_team_name"]
    away = final["away_team_name"]
    hs = final.get("home_team_score","")
    aws = final.get("away_team_score","")

    entry = {
        "year": year,
        "home": zh(home), "away": zh(away),
        "score": f"{hs}-{aws}" if hs and aws else "",
        "stadium": final.get("stadium_name",""),
        "city": final.get("city_name",""),
        "extraTime": final.get("extra_time") == "1",
        "penalties": final.get("penalty_shootout") == "1",
        "penScore": "",
        "goals": final_goals,
    }
    if entry["penalties"]:
        hp = final.get("home_team_score_penalties","")
        ap = final.get("away_team_score_penalties","")
        entry["penScore"] = f"{hp}-{ap}"
    finals_list.append(entry)

# ── Write JSON files ───────────────────────────────────────────────
os.makedirs(OUT, exist_ok=True)

def write_json(name, data):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",",":"))
    size = os.path.getsize(path)
    print(f"  ✓ {name} ({size/1024:.1f} KB)")

write_json("champions.json", champions_data)
write_json("scorers.json", scorers_data)
write_json("teams.json", teams_data)
write_json("records.json", records_data)
write_json("finals.json", finals_list)

print(f"\n✅ Done! {len(os.listdir(OUT))} files in {OUT}")
