#!/usr/bin/env python3
"""
Build per-team detail JSON for the enhanced team detail page.
Uses jfjelstul/worldcup CSV data (19 datasets beyond what build_history_data.py uses).
Output: public/data/team-detail/{ISO}.json
"""
import csv, json, io, os, urllib.request
from collections import defaultdict
from datetime import date

BASE = "https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv"
OUT  = os.path.join(os.path.dirname(__file__), "..", "public", "data", "team-detail")

def fetch_csv(name):
    url = f"{BASE}/{name}.csv"
    print(f"  Fetching {name}.csv ...")
    with urllib.request.urlopen(url) as r:
        text = r.read().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    print(f"    → {len(rows)} rows")
    return rows

# ── Mappings ────────────────────────────────────────────────────────
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
    "Switzerland":"瑞士","Togo":"多哥","Trinidad and Tobago":"特多",
    "Tunisia":"突尼斯","Turkey":"土耳其","Ukraine":"乌克兰",
    "United Arab Emirates":"阿联酋","United States":"美国","Uruguay":"乌拉圭",
    "Wales":"威尔士","Yugoslavia":"南斯拉夫","Zaire":"扎伊尔",
    "Algeria":"阿尔及利亚","Angola":"安哥拉","Republic of Ireland":"爱尔兰",
    "FR Yugoslavia":"南联盟","Korea Republic":"韩国","Korea DPR":"朝鲜",
    "IR Iran":"伊朗","Côte d'Ivoire":"科特迪瓦","Congo DR":"刚果(金)",
    "USA":"美国","USSR":"苏联","West Germany":"西德","East Germany":"东德",
    "Paraguay":"巴拉圭","Senegal":"塞内加尔","Costa Rica":"哥斯达黎加",
    "Serbia":"塞尔维亚","Switzerland":"瑞士","Morocco":"摩洛哥",
    "Japan":"日本","Croatia":"克罗地亚","South Korea":"韩国",
    "Jordan":"约旦","Cape Verde":"佛得角","Curaçao":"库拉索",
    "Uzbekistan":"乌兹别克斯坦",
}

# Team name → ISO code (matching teamIso.js)
TEAM_ISO = {
    "Argentina":"AR","Australia":"AU","Austria":"AT","Belgium":"BE",
    "Bolivia":"BO","Brazil":"BR","Bulgaria":"BG","Cameroon":"CM",
    "Canada":"CA","Chile":"CL","China PR":"CN","Colombia":"CO",
    "Costa Rica":"CR","Croatia":"HR","Cuba":"CU","Czech Republic":"CZ",
    "Czechoslovakia":"CZ","Denmark":"DK","Ecuador":"EC","Egypt":"EG",
    "El Salvador":"SV","England":"EN","France":"FR","Germany":"DE",
    "Germany FR":"DE","Germany DR":"DD","Ghana":"GH","Greece":"GR",
    "Haiti":"HT","Honduras":"HN","Hungary":"HU","Iceland":"IS",
    "Indonesia":"ID","Iran":"IR","Iraq":"IQ","Ireland":"IE",
    "Israel":"IL","Italy":"IT","Ivory Coast":"CI","Jamaica":"JM",
    "Japan":"JP","Kuwait":"KW","Mexico":"MX","Morocco":"MA",
    "Netherlands":"NL","New Zealand":"NZ","Nigeria":"NG","North Korea":"KP",
    "Northern Ireland":"NIR","Norway":"NO","Panama":"PA","Paraguay":"PY",
    "Peru":"PE","Poland":"PL","Portugal":"PT","Qatar":"QA",
    "Romania":"RO","Russia":"RU","Saudi Arabia":"SA","Scotland":"SC",
    "Senegal":"SN","Serbia":"RS","Serbia and Montenegro":"SCG",
    "Slovakia":"SK","Slovenia":"SI","South Africa":"ZA","South Korea":"KR",
    "Soviet Union":"SU","Spain":"ES","Sweden":"SE","Switzerland":"CH",
    "Togo":"TG","Trinidad and Tobago":"TT","Tunisia":"TN","Turkey":"TR",
    "Ukraine":"UA","United Arab Emirates":"AE","United States":"US",
    "Uruguay":"UY","Wales":"WL","Yugoslavia":"YU","Zaire":"ZR",
    "Algeria":"DZ","Angola":"AO","Bosnia and Herzegovina":"BA",
    "Côte d'Ivoire":"CI","Congo DR":"CD","Dutch East Indies":"DEI",
    "Korea Republic":"KR","Korea DPR":"KP","IR Iran":"IR",
    "USA":"US","USSR":"SU","West Germany":"DE","East Germany":"DD",
    "Republic of Ireland":"IE","FR Yugoslavia":"YU",
    "Cape Verde":"CV","Curaçao":"CW","Jordan":"JO","Uzbekistan":"UZ",
    "China":"CN",
}

CONFED = {
    "AR":"CONMEBOL","AT":"UEFA","AU":"AFC","BE":"UEFA","BO":"CONMEBOL",
    "BR":"CONMEBOL","BG":"UEFA","CM":"CAF","CA":"CONCACAF","CL":"CONMEBOL",
    "CN":"AFC","CO":"CONMEBOL","CR":"CONCACAF","HR":"UEFA","CU":"CONCACAF",
    "CZ":"UEFA","DK":"UEFA","EC":"CONMEBOL","EG":"CAF","SV":"CONCACAF",
    "EN":"UEFA","FR":"UEFA","DE":"UEFA","GH":"CAF","GR":"UEFA",
    "HT":"CONCACAF","HN":"CONCACAF","HU":"UEFA","IS":"UEFA","ID":"AFC",
    "IR":"AFC","IQ":"AFC","IE":"UEFA","IL":"UEFA","IT":"UEFA",
    "CI":"CAF","JM":"CONCACAF","JP":"AFC","KW":"AFC","MX":"CONCACAF",
    "MA":"CAF","NL":"UEFA","NZ":"OFC","NG":"CAF","KP":"AFC",
    "NIR":"UEFA","NO":"UEFA","PA":"CONCACAF","PY":"CONMEBOL","PE":"CONMEBOL",
    "PL":"UEFA","PT":"UEFA","QA":"AFC","RO":"UEFA","RU":"UEFA",
    "SA":"AFC","SC":"UEFA","SN":"CAF","RS":"UEFA","SCG":"UEFA",
    "SK":"UEFA","SI":"UEFA","ZA":"CAF","KR":"AFC","SU":"UEFA",
    "ES":"UEFA","SE":"UEFA","CH":"UEFA","TG":"CAF","TT":"CONCACAF",
    "TN":"CAF","TR":"UEFA","UA":"UEFA","AE":"AFC","US":"CONCACAF",
    "UY":"CONMEBOL","WL":"UEFA","YU":"UEFA","ZR":"CAF","DZ":"CAF",
    "AO":"CAF","BA":"UEFA","CD":"CAF","DD":"UEFA","DEI":"AFC",
    "CV":"CAF","CW":"CONCACAF","JO":"AFC","UZ":"AFC",
}

CONFED_ZH = {
    "AFC":"亚足联","CAF":"非足联","CONCACAF":"中北美足联",
    "CONMEBOL":"南美足联","OFC":"大洋洲足联","UEFA":"欧足联",
}

STAGE_ZH = {
    "champion":"冠军","winner":"冠军","runner-up":"亚军","runners-up":"亚军",
    "third place":"季军","fourth place":"第四名",
    "quarter-finals":"八强","quarterfinals":"八强",
    "round of 16":"十六强","second round":"第二轮",
    "semi-finals":"四强","semifinals":"四强",
    "group stage":"小组赛","first round":"小组赛",
    "third-place match":"季军赛","third place match":"季军赛",
    "final":"决赛","final round":"决赛","finals":"决赛",
    "second group stage":"第二轮小组赛",
}

def zh(name):
    return TEAM_ZH.get(name, name)

def get_iso(name):
    return TEAM_ISO.get(name)

def stage_zh(stage):
    return STAGE_ZH.get(stage.lower().strip(), stage)

def player_name(row):
    given = row.get("given_name","") or ""
    family = row.get("family_name","") or ""
    if given.lower() in ("not applicable","n/a",""):
        return family
    if family.lower() in ("not applicable","n/a",""):
        return given
    return f"{given} {family}".strip()

# ════════════════════════════════════════════════════════════════════
print("=== Building Per-Team Detail Data ===\n")

# Fetch all needed CSVs
tournaments    = fetch_csv("tournaments")
matches        = fetch_csv("matches")
goals          = fetch_csv("goals")
team_apps      = fetch_csv("team_appearances")
squads_csv     = fetch_csv("squads")
mgr_appts     = fetch_csv("manager_appointments")
bookings       = fetch_csv("bookings")
group_stands   = fetch_csv("group_standings")
teams_info     = fetch_csv("teams")
player_apps    = fetch_csv("player_appearances")
players_csv    = fetch_csv("players")
subs_csv       = fetch_csv("substitutions")
stadiums_csv   = fetch_csv("stadiums")

print()

# Filter men's tournaments only
men_tournaments = [t for t in tournaments if "Women" not in t.get("tournament_name","")]
men_ids = {t["tournament_id"] for t in men_tournaments}

# Build tournament year lookup
tourn_year = {}
for t in men_tournaments:
    tourn_year[t["tournament_id"]] = int(t["year"])

# Filter all data to men's only
men_matches    = [m for m in matches if m["tournament_id"] in men_ids]
men_goals      = [g for g in goals if g["tournament_id"] in men_ids]
men_team_apps  = [a for a in team_apps if a["tournament_id"] in men_ids]
men_squads     = [s for s in squads_csv if s["tournament_id"] in men_ids]
men_mgr_appts  = [m for m in mgr_appts if m["tournament_id"] in men_ids]
men_bookings   = [b for b in bookings if b["tournament_id"] in men_ids]
men_group_stands = [g for g in group_stands if g["tournament_id"] in men_ids]
men_player_apps = [p for p in player_apps if p["tournament_id"] in men_ids]
men_subs        = [s for s in subs_csv if s.get("tournament_id","") in men_ids]

# ── Age calculation helper ─────────────────────────────────────────
WC_START = date(2026, 6, 11)

def calc_age(birth_date_str):
    """Calculate age as of 2026-06-11. Returns int or None."""
    if not birth_date_str or birth_date_str.strip() == "":
        return None
    try:
        parts = birth_date_str.strip().split("-")
        bd = date(int(parts[0]), int(parts[1]), int(parts[2]))
        age = WC_START.year - bd.year - ((WC_START.month, WC_START.day) < (bd.month, bd.day))
        return age if 15 <= age <= 90 else None
    except (ValueError, IndexError):
        return None

# ── Players index: player_id → {birth_date, age} ──────────────────
player_info = {}
for p in players_csv:
    pid = p.get("player_id", "")
    if pid:
        bd = p.get("birth_date", "")
        player_info[pid] = {
            "birth_date": bd if bd else None,
            "age": calc_age(bd),
        }

# ── Stadiums index: stadium_id → {name, city, capacity} ───────────
stadium_lookup = {}
for s in stadiums_csv:
    sid = s.get("stadium_id", "")
    if sid:
        cap = 0
        try:
            cap = int(s.get("stadium_capacity", 0) or 0)
        except ValueError:
            pass
        stadium_lookup[sid] = {
            "stadium": s.get("stadium_name", ""),
            "city": s.get("city_name", ""),
            "capacity": cap,
        }

# ── Substitutions by match_id + team_name ──────────────────────────
subs_by_match_team = defaultdict(list)
for s in men_subs:
    mid = s.get("match_id", "")
    team = s.get("team_name", "")
    off_name = player_name({"given_name": s.get("given_name",""), "family_name": s.get("family_name","")})
    # Determine minute display
    minute_label = s.get("minute_label", "")
    if not minute_label:
        reg = s.get("minute_regulation", "")
        stop = s.get("minute_stoppage", "")
        if reg:
            minute_label = f"{reg}+{stop}'" if stop and stop != "0" else f"{reg}'"
    subs_by_match_team[(mid, team)].append({
        "player_id": s.get("player_id", ""),
        "name": off_name,
        "minute": minute_label,
        "going_off": s.get("going_off", "") == "1",
        "coming_on": s.get("coming_on", "") == "1",
    })

# ── Build indexes ──────────────────────────────────────────────────

# Match lookup: match_id → match row
match_lookup = {m["match_id"]: m for m in men_matches}
# Match → year
match_year = {}
for m in men_matches:
    match_year[m["match_id"]] = tourn_year.get(m["tournament_id"], 0)

# Goals by match
goals_by_match = defaultdict(list)
for g in men_goals:
    goals_by_match[g["match_id"]].append(g)

# Matches by tournament + team
matches_by_tourn_team = defaultdict(list)
for m in men_matches:
    home = m.get("home_team_name","")
    away = m.get("away_team_name","")
    tid = m["tournament_id"]
    if home:
        matches_by_tourn_team[(tid, home)].append(m)
    if away:
        matches_by_tourn_team[(tid, away)].append(m)

# Group standings by tournament + team
group_by_tourn = defaultdict(lambda: defaultdict(list))
for g in men_group_stands:
    group_by_tourn[g["tournament_id"]][g.get("group_name","")].append(g)

# Team's group by tournament
team_group = {}
for g in men_group_stands:
    team_group[(g["tournament_id"], g["team_name"])] = g.get("group_name","")

# Squad by tournament + team
squads_by_tourn_team = defaultdict(list)
for s in men_squads:
    squads_by_tourn_team[(s["tournament_id"], s.get("team_name",""))].append(s)

# Manager by tournament + team
mgr_by_tourn_team = {}
for m in men_mgr_appts:
    key = (m["tournament_id"], m.get("team_name",""))
    mgr_by_tourn_team[key] = player_name(m)

# Bookings by tournament + team
bookings_by_tourn_team = defaultdict(lambda: {"yellow":0,"red":0})
for b in men_bookings:
    tid = b.get("tournament_id","")
    team = b.get("team_name","")
    if b.get("yellow_card") == "1":
        bookings_by_tourn_team[(tid, team)]["yellow"] += 1
    if b.get("red_card") == "1" or b.get("second_yellow_card") == "1" or b.get("sending_off") == "1":
        bookings_by_tourn_team[(tid, team)]["red"] += 1

# Player appearances: count per team
player_stats_by_team = defaultdict(lambda: defaultdict(lambda: {"apps":0,"goals":0,"starts":0,"name":""}))
for p in men_player_apps:
    team = p.get("team_name","")
    pid = p.get("player_id","")
    name = player_name(p)
    player_stats_by_team[team][pid]["apps"] += 1
    player_stats_by_team[team][pid]["name"] = name
    if p.get("starter","") == "1":
        player_stats_by_team[team][pid]["starts"] += 1

# Add goals to player stats + estimate apps from distinct matches for players missing from player_appearances
player_goal_matches = defaultdict(set)   # (team, pid) → set of match_ids
for g in men_goals:
    if g.get("own_goal") == "1":
        continue
    team = g.get("team_name","")
    pid = g.get("player_id","")
    mid = g.get("match_id","")
    player_stats_by_team[team][pid]["goals"] += 1
    player_stats_by_team[team][pid]["name"] = player_name(g)
    if mid:
        player_goal_matches[(team, pid)].add(mid)

# For players with goals but 0 apps, estimate apps from distinct goal-match count
for (team, pid), match_ids in player_goal_matches.items():
    if player_stats_by_team[team][pid]["apps"] == 0:
        player_stats_by_team[team][pid]["apps"] = len(match_ids)

# Qualified teams: tournament_id + team → performance
qualified_lookup = {}
for q in fetch_csv("qualified_teams"):
    if q["tournament_id"] in men_ids:
        qualified_lookup[(q["tournament_id"], q.get("team_name",""))] = q.get("performance","")

# Tournament winners
tourn_winners = {}
for t in men_tournaments:
    tourn_winners[t["tournament_id"]] = t.get("winner","")

# Team confederation from teams.csv
team_confed = {}
for t in teams_info:
    name = t.get("team_name","")
    conf = t.get("confederation_name","")
    team_confed[name] = conf

# ── Collect all unique team names ──────────────────────────────────
all_teams = set()
for a in men_team_apps:
    all_teams.add(a["team_name"])

print(f"Found {len(all_teams)} unique teams in World Cup history.\n")

# ── Build per-team JSON ────────────────────────────────────────────
os.makedirs(OUT, exist_ok=True)
file_count = 0

for team_name in sorted(all_teams):
    iso = get_iso(team_name)
    if not iso:
        print(f"  ⚠ No ISO code for '{team_name}', skipping")
        continue

    name_zh = zh(team_name)
    confed_code = CONFED.get(iso, "")
    confed_name = CONFED_ZH.get(confed_code, confed_code)

    # ── Aggregate stats ──
    total = {"p":0,"w":0,"d":0,"l":0,"gf":0,"ga":0,"yellow":0,"red":0}
    tourn_ids_for_team = set()
    for a in men_team_apps:
        if a["team_name"] != team_name:
            continue
        tid = a["tournament_id"]
        tourn_ids_for_team.add(tid)
        r = a.get("result","")
        if r == "win": total["w"] += 1
        elif r == "draw": total["d"] += 1
        elif r == "lose": total["l"] += 1
        try: total["gf"] += int(a.get("goals_for",0) or 0)
        except: pass
        try: total["ga"] += int(a.get("goals_against",0) or 0)
        except: pass
    total["p"] = total["w"] + total["d"] + total["l"]
    total["gd"] = total["gf"] - total["ga"]
    total["winRate"] = round(total["w"]/total["p"]*100, 1) if total["p"] > 0 else 0

    # Aggregate bookings
    for tid in tourn_ids_for_team:
        cards = bookings_by_tourn_team.get((tid, team_name), {"yellow":0,"red":0})
        total["yellow"] += cards["yellow"]
        total["red"] += cards["red"]

    # ── Top players ──
    ps = player_stats_by_team.get(team_name, {})
    top_players_out = []
    for pid_key, pdata in sorted(ps.items(), key=lambda x: (-x[1]["goals"], -x[1]["apps"])):
        if len(top_players_out) >= 15:
            break
        if pdata["apps"] > 0 or pdata["goals"] > 0:
            entry = {
                "name": pdata["name"],
                "apps": pdata["apps"],
                "goals": pdata["goals"],
                "starts": pdata["starts"],
            }
            info = player_info.get(pid_key, {})
            if info.get("birth_date"):
                entry["birthDate"] = info["birth_date"]
            if info.get("age") is not None:
                entry["age"] = info["age"]
            top_players_out.append(entry)

    # ── Per-tournament detail ──
    tourn_details = []
    for tid in sorted(tourn_ids_for_team, key=lambda x: tourn_year.get(x, 0)):
        year = tourn_year.get(tid, 0)
        perf = qualified_lookup.get((tid, team_name), "")
        # Check if this team won the tournament
        is_winner = tourn_winners.get(tid,"") == team_name
        if is_winner:
            stage = "冠军"
        elif perf.lower() in ("final","final round","finals") and not is_winner:
            stage = "亚军"
        else:
            stage = stage_zh(perf) if perf else ""
        manager = mgr_by_tourn_team.get((tid, team_name), "")

        # Group info
        grp_name = team_group.get((tid, team_name), "")
        grp_standings = []
        if grp_name and grp_name in group_by_tourn[tid]:
            for row in sorted(group_by_tourn[tid][grp_name], key=lambda x: int(x.get("position",99))):
                try:
                    grp_standings.append({
                        "pos": int(row.get("position",0)),
                        "team": zh(row.get("team_name","")),
                        "p": int(row.get("played",0) or 0),
                        "w": int(row.get("wins",0) or 0),
                        "d": int(row.get("draws",0) or 0),
                        "l": int(row.get("losses",0) or 0),
                        "gf": int(row.get("goals_for",0) or 0),
                        "ga": int(row.get("goals_against",0) or 0),
                        "pts": int(row.get("points",0) or 0),
                    })
                except (ValueError, KeyError):
                    pass

        # Matches for this team in this tournament
        team_matches = matches_by_tourn_team.get((tid, team_name), [])
        matches_out = []
        for m in team_matches:
            mid = m["match_id"]
            home = m.get("home_team_name","")
            away = m.get("away_team_name","")
            try:
                hs = int(m.get("home_team_score","") or 0)
                aws = int(m.get("away_team_score","") or 0)
            except ValueError:
                hs, aws = 0, 0

            match_goals = []
            for g in goals_by_match.get(mid, []):
                match_goals.append({
                    "player": player_name(g),
                    "team": zh(g.get("team_name","")),
                    "minute": g.get("minute_label",""),
                    "penalty": g.get("penalty") == "1",
                    "ownGoal": g.get("own_goal") == "1",
                })

            # Venue info from stadiums.csv
            venue = None
            stadium_id = m.get("stadium_id", "")
            if stadium_id and stadium_id in stadium_lookup:
                venue = stadium_lookup[stadium_id]

            # Substitutions: pair going_off and coming_on entries
            match_subs_home = subs_by_match_team.get((mid, home), [])
            match_subs_away = subs_by_match_team.get((mid, away), [])
            all_match_subs = match_subs_home + match_subs_away
            # Group subs by minute to pair off/on
            subs_off = [s for s in all_match_subs if s["going_off"]]
            subs_on = [s for s in all_match_subs if s["coming_on"]]
            # Build paired substitution list
            subs_out = []
            # Match off/on by minute and team context (they share same minute)
            paired_on = set()
            for off_sub in subs_off:
                # Find matching on sub with same minute
                for i, on_sub in enumerate(subs_on):
                    if i not in paired_on and on_sub["minute"] == off_sub["minute"]:
                        subs_out.append({
                            "playerOff": off_sub["name"],
                            "playerOn": on_sub["name"],
                            "minute": off_sub["minute"],
                        })
                        paired_on.add(i)
                        break
                else:
                    # No matching on sub found, just record the off
                    subs_out.append({
                        "playerOff": off_sub["name"],
                        "playerOn": "",
                        "minute": off_sub["minute"],
                    })
            # Any unpaired coming_on subs
            for i, on_sub in enumerate(subs_on):
                if i not in paired_on:
                    subs_out.append({
                        "playerOff": "",
                        "playerOn": on_sub["name"],
                        "minute": on_sub["minute"],
                    })

            match_entry = {
                "stage": m.get("stage_name",""),
                "home": zh(home),
                "away": zh(away),
                "homeScore": hs,
                "awayScore": aws,
                "extra": m.get("extra_time") == "1",
                "pens": m.get("penalty_shootout") == "1",
                "penScore": f"{m.get('home_team_score_penalties','')}-{m.get('away_team_score_penalties','')}" if m.get("penalty_shootout") == "1" else "",
                "goals": match_goals,
            }
            if venue:
                match_entry["venue"] = venue
            if subs_out:
                match_entry["subs"] = subs_out
            matches_out.append(match_entry)

        # Squad for this tournament
        squad_rows = squads_by_tourn_team.get((tid, team_name), [])
        squad_out = []
        for s in sorted(squad_rows, key=lambda x: int(x.get("shirt_number",99) or 99)):
            pos = s.get("position_name","") or ""
            pos_short = ""
            if "goal" in pos.lower(): pos_short = "GK"
            elif "defend" in pos.lower() or "back" in pos.lower(): pos_short = "DF"
            elif "midfield" in pos.lower(): pos_short = "MF"
            elif "forward" in pos.lower() or "strik" in pos.lower() or "wing" in pos.lower() or "attack" in pos.lower(): pos_short = "FW"
            else: pos_short = pos[:2].upper() if pos else ""

            try:
                num = int(s.get("shirt_number",0) or 0)
            except ValueError:
                num = 0

            squad_entry = {
                "name": player_name(s),
                "pos": pos_short,
                "num": num,
            }
            # Add birth_date and age from players.csv
            spid = s.get("player_id", "")
            if spid and spid in player_info:
                pinfo = player_info[spid]
                if pinfo.get("birth_date"):
                    squad_entry["birthDate"] = pinfo["birth_date"]
                if pinfo.get("age") is not None:
                    squad_entry["age"] = pinfo["age"]
            squad_out.append(squad_entry)

        # Cards for this tournament
        cards = bookings_by_tourn_team.get((tid, team_name), {"yellow":0,"red":0})

        entry = {
            "year": year,
            "stage": stage,
            "manager": manager,
            "cards": cards,
        }
        if grp_name:
            entry["group"] = {"name": grp_name, "standings": grp_standings}
        if matches_out:
            entry["matches"] = matches_out
        if squad_out:
            entry["squad"] = squad_out

        tourn_details.append(entry)

    # Sort tournaments newest first
    tourn_details.sort(key=lambda x: -x["year"])

    # ── Final output ──
    team_data = {
        "name": team_name,
        "nameZh": name_zh,
        "iso": iso,
        "confederation": confed_code,
        "confederationZh": confed_name,
        "totalStats": total,
        "topPlayers": top_players_out,
        "tournaments": tourn_details,
    }

    # Write file
    filename = f"{iso}.json"
    filepath = os.path.join(OUT, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(team_data, f, ensure_ascii=False, separators=(",",":"))
    size = os.path.getsize(filepath)
    file_count += 1

print(f"\n✅ Done! {file_count} team detail files in {OUT}")
