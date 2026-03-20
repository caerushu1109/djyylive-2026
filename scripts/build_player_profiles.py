#!/usr/bin/env python3
"""
Build per-player profile JSON from jfjelstul/worldcup CSV data.
Output: public/data/players/{player_id}.json
Also builds an index: public/data/players/index.json (name → player_id mapping)

Data included per player:
- Basic info (name, birth date, positions)
- World Cup career totals (appearances, goals, cards, etc.)
- Per-tournament breakdown
- Goal details (opponent, minute, penalty/own goal)
- Booking records
- Awards (Golden Ball, Golden Boot, etc.)
- Penalty shootout record
"""
import csv, json, io, os, urllib.request
from collections import defaultdict
from datetime import date

BASE = "https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv"
OUT  = os.path.join(os.path.dirname(__file__), "..", "public", "data", "players")

TOURNAMENT_HOSTS = {
    "1930": "🇺🇾", "1934": "🇮🇹", "1938": "🇫🇷", "1950": "🇧🇷",
    "1954": "🇨🇭", "1958": "🇸🇪", "1962": "🇨🇱", "1966": "🏴\u200d☠️",
    "1970": "🇲🇽", "1974": "🇩🇪", "1978": "🇦🇷", "1982": "🇪🇸",
    "1986": "🇲🇽", "1990": "🇮🇹", "1994": "🇺🇸", "1998": "🇫🇷",
    "2002": "🇰🇷🇯🇵", "2006": "🇩🇪", "2010": "🇿🇦", "2014": "🇧🇷",
    "2018": "🇷🇺", "2022": "🇶🇦",
}

AWARD_ZH = {
    "Golden Ball": "金球奖",
    "Silver Ball": "银球奖",
    "Bronze Ball": "铜球奖",
    "Golden Boot": "金靴奖",
    "Silver Boot": "银靴奖",
    "Bronze Boot": "铜靴奖",
    "Golden Glove": "金手套奖",
    "Best Young Player": "最佳新秀",
}

TEAM_ZH = {
    "Argentina":"阿根廷","Australia":"澳大利亚","Austria":"奥地利","Belgium":"比利时",
    "Bolivia":"玻利维亚","Bosnia and Herzegovina":"波黑","Brazil":"巴西","Bulgaria":"保加利亚",
    "Cameroon":"喀麦隆","Canada":"加拿大","Chile":"智利","China PR":"中国",
    "Colombia":"哥伦比亚","Costa Rica":"哥斯达黎加","Croatia":"克罗地亚","Cuba":"古巴",
    "Czech Republic":"捷克","Czechoslovakia":"捷克斯洛伐克","Denmark":"丹麦",
    "Ecuador":"厄瓜多尔","Egypt":"埃及","El Salvador":"萨尔瓦多","England":"英格兰",
    "France":"法国","Germany":"德国","Germany FR":"西德","Germany DR":"东德",
    "Ghana":"加纳","Greece":"希腊","Haiti":"海地","Honduras":"洪都拉斯",
    "Hungary":"匈牙利","Iceland":"冰岛","Iran":"伊朗","Iraq":"伊拉克",
    "Ireland":"爱尔兰","Israel":"以色列","Italy":"意大利","Ivory Coast":"科特迪瓦",
    "Jamaica":"牙买加","Japan":"日本","Kuwait":"科威特","Mexico":"墨西哥",
    "Morocco":"摩洛哥","Netherlands":"荷兰","New Zealand":"新西兰","Nigeria":"尼日利亚",
    "North Korea":"朝鲜","Northern Ireland":"北爱尔兰","Norway":"挪威",
    "Panama":"巴拿马","Paraguay":"巴拉圭","Peru":"秘鲁","Poland":"波兰",
    "Portugal":"葡萄牙","Qatar":"卡塔尔","Romania":"罗马尼亚","Russia":"俄罗斯",
    "Saudi Arabia":"沙特","Scotland":"苏格兰","Senegal":"塞内加尔","Serbia":"塞尔维亚",
    "Serbia and Montenegro":"塞黑","Slovakia":"斯洛伐克","Slovenia":"斯洛文尼亚",
    "South Africa":"南非","South Korea":"韩国","Soviet Union":"苏联","Spain":"西班牙",
    "Sweden":"瑞典","Switzerland":"瑞士","Togo":"多哥","Trinidad and Tobago":"特多",
    "Tunisia":"突尼斯","Turkey":"土耳其","Ukraine":"乌克兰",
    "United Arab Emirates":"阿联酋","United States":"美国","Uruguay":"乌拉圭",
    "Wales":"威尔士","Yugoslavia":"南斯拉夫","Zaire":"扎伊尔",
    "Algeria":"阿尔及利亚","Angola":"安哥拉","Republic of Ireland":"爱尔兰",
    "FR Yugoslavia":"南联盟","Korea Republic":"韩国","Korea DPR":"朝鲜",
    "IR Iran":"伊朗","Côte d'Ivoire":"科特迪瓦","Congo DR":"刚果(金)",
    "Dutch East Indies":"荷属东印度",
    "Cabo Verde":"佛得角","Curaçao":"库拉索","Jordan":"约旦",
    "Uzbekistan":"乌兹别克斯坦","Seychelles":"塞舌尔",
}

def fetch_csv(name):
    url = f"{BASE}/{name}.csv"
    print(f"  Fetching {name}.csv ...")
    with urllib.request.urlopen(url) as r:
        text = r.read().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    print(f"    → {len(rows)} rows")
    return rows

def year_from_tournament(t_name):
    """Extract year from tournament name like 'FIFA World Cup 2022'"""
    for part in t_name.split():
        if part.isdigit() and len(part) == 4:
            return part
    return ""

def main():
    print("Building player profiles...\n")
    os.makedirs(OUT, exist_ok=True)

    # Fetch all needed CSVs
    players_csv = fetch_csv("players")
    appearances_csv = fetch_csv("player_appearances")
    goals_csv = fetch_csv("goals")
    squads_csv = fetch_csv("squads")
    bookings_csv = fetch_csv("bookings")
    substitutions_csv = fetch_csv("substitutions")
    matches_csv = fetch_csv("matches")

    # Try fetching optional CSVs
    try:
        awards_csv = fetch_csv("award_winners")
    except Exception:
        print("  ⚠ award_winners.csv not available, skipping awards")
        awards_csv = []
    try:
        penalties_csv = fetch_csv("penalty_kicks")
    except Exception:
        print("  ⚠ penalty_kicks.csv not available, skipping penalties")
        penalties_csv = []

    # Build match info lookup
    match_info = {}
    for m in matches_csv:
        mid = m.get("match_id", "")
        match_info[mid] = {
            "date": m.get("match_date", ""),
            "stage": m.get("stage_name", ""),
            "home": m.get("home_team_name", ""),
            "away": m.get("away_team_name", ""),
            "homeScore": int(m.get("home_team_score", 0) or 0),
            "awayScore": int(m.get("away_team_score", 0) or 0),
        }

    # Build player base info
    player_base = {}
    for p in players_csv:
        pid = p.get("player_id", "")
        if not pid:
            continue
        positions = []
        if p.get("goal_keeper") == "1": positions.append("GK")
        if p.get("defender") == "1": positions.append("DF")
        if p.get("midfielder") == "1": positions.append("MF")
        if p.get("forward") == "1": positions.append("FW")
        player_base[pid] = {
            "id": pid,
            "name": f"{p.get('given_name', '')} {p.get('family_name', '')}".strip(),
            "familyName": p.get("family_name", ""),
            "givenName": p.get("given_name", ""),
            "birthDate": p.get("birth_date", ""),
            "positions": positions,
            "wikiLink": p.get("player_wikipedia_link", ""),
        }

    # Aggregate appearances per player per tournament
    # { player_id: { tournament_year: { apps, starts, subs, team, shirtNumber } } }
    player_tournaments = defaultdict(lambda: defaultdict(lambda: {
        "apps": 0, "starts": 0, "subs": 0, "team": "", "shirtNumber": "",
        "tournamentName": "", "year": "",
    }))

    for a in appearances_csv:
        pid = a.get("player_id", "")
        if not pid:
            continue
        year = year_from_tournament(a.get("tournament_name", ""))
        t = player_tournaments[pid][year]
        t["apps"] += 1
        if a.get("starter") == "1":
            t["starts"] += 1
        if a.get("substitute") == "1":
            t["subs"] += 1
        t["team"] = a.get("team_name", "")
        t["tournamentName"] = a.get("tournament_name", "")
        t["year"] = year

    # Get shirt numbers from squads
    for s in squads_csv:
        pid = s.get("player_id", "")
        year = year_from_tournament(s.get("tournament_name", ""))
        if pid and year and pid in player_tournaments:
            player_tournaments[pid][year]["shirtNumber"] = s.get("shirt_number", "")

    # Aggregate goals per player
    # { player_id: { tournament_year: [goal_details] } }
    player_goals = defaultdict(lambda: defaultdict(list))
    for g in goals_csv:
        pid = g.get("player_id", "")
        if not pid:
            continue
        year = year_from_tournament(g.get("tournament_name", ""))
        mi = match_info.get(g.get("match_id", ""), {})
        team = g.get("team_name", "")
        opponent = mi.get("away") if mi.get("home") == team else mi.get("home", "")
        player_goals[pid][year].append({
            "minute": g.get("minute_label", ""),
            "penalty": g.get("penalty") == "1",
            "ownGoal": g.get("own_goal") == "1",
            "opponent": opponent,
            "opponentZh": TEAM_ZH.get(opponent, opponent),
            "stage": g.get("stage_name", ""),
            "date": g.get("match_date", ""),
        })

    # Aggregate bookings per player
    player_bookings = defaultdict(lambda: {"yellow": 0, "red": 0, "details": []})
    for b in bookings_csv:
        pid = b.get("player_id", "")
        if not pid:
            continue
        year = year_from_tournament(b.get("tournament_name", ""))
        if b.get("yellow_card") == "1":
            player_bookings[pid]["yellow"] += 1
        if b.get("red_card") == "1" or b.get("second_yellow_card") == "1" or b.get("sending_off") == "1":
            player_bookings[pid]["red"] += 1
        mi = match_info.get(b.get("match_id", ""), {})
        team = b.get("team_name", "")
        opponent = mi.get("away") if mi.get("home") == team else mi.get("home", "")
        player_bookings[pid]["details"].append({
            "year": year,
            "opponent": opponent,
            "opponentZh": TEAM_ZH.get(opponent, opponent),
            "minute": b.get("minute_label", ""),
            "yellow": b.get("yellow_card") == "1",
            "red": b.get("red_card") == "1" or b.get("second_yellow_card") == "1",
        })

    # Awards per player
    player_awards = defaultdict(list)
    for a in awards_csv:
        pid = a.get("player_id", "")
        if not pid:
            continue
        year = year_from_tournament(a.get("tournament_name", ""))
        award = a.get("award_name", "")
        player_awards[pid].append({
            "year": year,
            "award": award,
            "awardZh": AWARD_ZH.get(award, award),
            "shared": a.get("shared") == "1",
        })

    # Penalty shootout records per player
    player_penalties = defaultdict(lambda: {"taken": 0, "scored": 0, "details": []})
    for pk in penalties_csv:
        pid = pk.get("player_id", "")
        if not pid:
            continue
        player_penalties[pid]["taken"] += 1
        if pk.get("converted") == "1":
            player_penalties[pid]["scored"] += 1
        year = year_from_tournament(pk.get("tournament_name", ""))
        mi = match_info.get(pk.get("match_id", ""), {})
        team = pk.get("team_name", "")
        opponent = mi.get("away") if mi.get("home") == team else mi.get("home", "")
        player_penalties[pid]["details"].append({
            "year": year,
            "opponent": opponent,
            "converted": pk.get("converted") == "1",
        })

    # Collect all player IDs that have any data
    all_pids = set(player_base.keys()) | set(player_tournaments.keys())

    print(f"\nBuilding profiles for {len(all_pids)} players...")

    # Build name → id index for linking SportMonks squad data
    name_index = {}
    count = 0

    for pid in sorted(all_pids):
        base = player_base.get(pid, {"id": pid, "name": "", "familyName": "", "givenName": "", "birthDate": "", "positions": [], "wikiLink": ""})

        # Per-tournament data
        tournaments = []
        total_apps = 0
        total_goals = 0
        total_starts = 0

        for year in sorted(player_tournaments.get(pid, {}).keys()):
            t = player_tournaments[pid][year]
            goals_in_tournament = [g for g in player_goals.get(pid, {}).get(year, []) if not g["ownGoal"]]
            own_goals = [g for g in player_goals.get(pid, {}).get(year, []) if g["ownGoal"]]

            total_apps += t["apps"]
            total_goals += len(goals_in_tournament)
            total_starts += t["starts"]

            tournaments.append({
                "year": year,
                "team": t["team"],
                "teamZh": TEAM_ZH.get(t["team"], t["team"]),
                "host": TOURNAMENT_HOSTS.get(year, ""),
                "apps": t["apps"],
                "starts": t["starts"],
                "subs": t["subs"],
                "shirtNumber": t["shirtNumber"],
                "goals": len(goals_in_tournament),
                "ownGoals": len(own_goals),
                "goalDetails": goals_in_tournament,
            })

        # All goal details flat list (for display)
        all_goals = []
        for year in sorted(player_goals.get(pid, {}).keys()):
            for g in player_goals[pid][year]:
                if not g["ownGoal"]:
                    all_goals.append({**g, "year": year})

        bk = player_bookings.get(pid, {"yellow": 0, "red": 0, "details": []})
        aw = player_awards.get(pid, [])
        pk = player_penalties.get(pid, {"taken": 0, "scored": 0, "details": []})

        profile = {
            "id": pid,
            "name": base["name"],
            "familyName": base["familyName"],
            "givenName": base["givenName"],
            "birthDate": base["birthDate"],
            "positions": base["positions"],
            "career": {
                "tournaments": len(tournaments),
                "apps": total_apps,
                "starts": total_starts,
                "goals": total_goals,
                "yellowCards": bk["yellow"],
                "redCards": bk["red"],
                "penaltyShootouts": pk,
            },
            "tournaments": tournaments,
            "goals": all_goals,
            "awards": aw,
            "bookings": bk["details"],
        }

        # Write individual player JSON
        path = os.path.join(OUT, f"{pid}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(profile, f, ensure_ascii=False, separators=(",", ":"))

        # Add to name index
        full_name = base["name"]
        family_name = base["familyName"]
        if full_name:
            name_index[full_name] = pid
        if family_name and family_name != full_name:
            name_index[family_name] = pid

        count += 1
        if count % 500 == 0:
            print(f"  {count} players processed...")

    # Write name index
    index_path = os.path.join(OUT, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(name_index, f, ensure_ascii=False, indent=1)

    print(f"\n✓ Done! {count} player profiles saved to {OUT}/")
    print(f"  Index with {len(name_index)} name entries saved to {index_path}")

if __name__ == "__main__":
    main()
