from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / ".cache" / "worldcup" / "data-csv"
OUTPUT = ROOT / "src" / "worldcup-archive.js"


def read_csv(name: str) -> list[dict[str, str]]:
    path = DATA_DIR / name
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def men_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    return [row for row in rows if "Men's World Cup" in row.get("tournament_name", "")]


def to_int(value: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def player_name(row: dict[str, str]) -> str:
    given = row.get("given_name", "").strip()
    family = row.get("family_name", "").strip()
    if given.lower() == "not applicable":
        given = ""
    if family.lower() == "not applicable":
        family = ""
    return " ".join(part for part in [given, family] if part).strip() or "Unknown"


def manager_name(row: dict[str, str]) -> str:
    return player_name(row)


def ref_name(row: dict[str, str]) -> str:
    return player_name(row)


def compact_dump(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def normalize_performance(value: str) -> str:
    mapping = {
        "quater-finals": "quarter-finals",
        "quarter-final": "quarter-finals",
        "runners-up": "final",
        "runner-up": "final",
    }
    return mapping.get(value, value)


def build() -> None:
    tournaments = men_rows(read_csv("tournaments.csv"))
    matches = men_rows(read_csv("matches.csv"))
    goals = men_rows(read_csv("goals.csv"))
    penalty_kicks = men_rows(read_csv("penalty_kicks.csv"))
    bookings = men_rows(read_csv("bookings.csv"))
    substitutions = men_rows(read_csv("substitutions.csv"))
    qualified_teams = men_rows(read_csv("qualified_teams.csv"))
    squads = men_rows(read_csv("squads.csv"))
    player_appearances = men_rows(read_csv("player_appearances.csv"))
    manager_appointments = men_rows(read_csv("manager_appointments.csv"))
    manager_appearances = men_rows(read_csv("manager_appearances.csv"))
    referee_appointments = men_rows(read_csv("referee_appointments.csv"))
    referee_appearances = men_rows(read_csv("referee_appearances.csv"))
    host_countries = men_rows(read_csv("host_countries.csv"))
    tournament_stages = men_rows(read_csv("tournament_stages.csv"))
    groups = men_rows(read_csv("groups.csv"))
    group_standings = men_rows(read_csv("group_standings.csv"))
    tournament_standings = men_rows(read_csv("tournament_standings.csv"))
    awards = read_csv("awards.csv")
    award_winners = men_rows(read_csv("award_winners.csv"))
    teams = read_csv("teams.csv")
    confederations = read_csv("confederations.csv")
    stadiums = read_csv("stadiums.csv")
    team_appearances = men_rows(read_csv("team_appearances.csv"))

    tournament_lookup = {row["tournament_id"]: row for row in tournaments}
    team_lookup = {row["team_id"]: row for row in teams}
    confed_lookup = {row["confederation_id"]: row for row in confederations}
    award_lookup = {row["award_id"]: row for row in awards}
    stadium_lookup = {row["stadium_id"]: row for row in stadiums}

    unique_players = {row["player_id"] for row in squads}
    unique_managers = {row["manager_id"] for row in manager_appointments}
    unique_referees = {row["referee_id"] for row in referee_appointments}
    unique_stadiums = {row["stadium_id"] for row in matches}
    unique_teams = {row["team_id"] for row in qualified_teams}

    archive_overview = [
        {
            "label": "资料库范围",
            "value": "27 个数据集",
            "detail": "把 tournaments、matches、players、events、standings 全部压进历史页。",
        },
        {
            "label": "覆盖届次",
            "value": str(len(tournaments)),
            "detail": "完整覆盖 1930 到 2022 的 22 届男足世界杯。",
        },
        {
            "label": "比赛场次",
            "value": str(len(matches)),
            "detail": "逐场比赛结构数据，可反推阶段、场地、城市、裁判与事件。",
        },
        {
            "label": "事件条目",
            "value": str(len(goals) + len(penalty_kicks) + len(bookings) + len(substitutions)),
            "detail": "进球、点球、黄红牌、换人全部进入同一档案层。",
        },
        {
            "label": "球队档案",
            "value": str(len(unique_teams)),
            "detail": "包含参赛、排名、主办、分组和比赛表现。",
        },
        {
            "label": "球员档案",
            "value": str(len(unique_players)),
            "detail": "由 squads、player appearances、goals、awards 联合驱动。",
        },
        {
            "label": "主帅 / 裁判",
            "value": f"{len(unique_managers)} / {len(unique_referees)}",
            "detail": "不仅看球员，也把教练席和执法线补齐。",
        },
        {
            "label": "球场与城市",
            "value": str(len(unique_stadiums)),
            "detail": "所有主办球场与城市都能进入地理档案。",
        },
    ]

    format_evolution = []
    for row in tournaments:
        stages = [stage for stage in tournament_stages if stage["tournament_id"] == row["tournament_id"]]
        group_stage_count = sum(1 for stage in stages if stage["group_stage"] == "1")
        knockout_stage_count = sum(1 for stage in stages if stage["knockout_stage"] == "1")
        format_notes = []
        if row["round_of_16"] == "1":
            format_notes.append("16强")
        if row["quarter_finals"] == "1":
            format_notes.append("8强")
        if row["semi_finals"] == "1":
            format_notes.append("半决赛")
        if row["third_place_match"] == "1":
            format_notes.append("三四名")
        if row["second_group_stage"] == "1":
            format_notes.append("第二小组赛")
        if row["final_round"] == "1":
            format_notes.append("决赛轮")
        format_evolution.append(
            {
                "year": to_int(row["year"]),
                "teams": to_int(row["count_teams"]),
                "hosts": row["host_country"],
                "winner": row["winner"],
                "hostWon": row["host_won"] == "1",
                "groupStages": group_stage_count,
                "knockoutStages": knockout_stage_count,
                "groups": sum(1 for item in groups if item["tournament_id"] == row["tournament_id"]),
                "format": " / ".join(format_notes) or "特殊赛制",
            }
        )

    host_story = []
    host_perf_counter = Counter()
    for row in host_countries:
        tournament = tournament_lookup[row["tournament_id"]]
        performance = normalize_performance(row["performance"])
        host_perf_counter[performance] += 1
        host_story.append(
            {
                "year": to_int(tournament["year"]),
                "host": row["team_name"],
                "performance": performance,
                "winner": tournament["winner"],
                "hostWon": tournament["host_won"] == "1",
            }
        )
    host_story.sort(key=lambda item: item["year"])
    host_summary = [
        {"label": performance, "value": count}
        for performance, count in host_perf_counter.most_common()
    ]

    city_counter = Counter()
    stadium_counter = Counter()
    host_country_match_counter = Counter()
    for row in matches:
        city_counter[(row["city_name"], row["country_name"])] += 1
        stadium_counter[row["stadium_id"]] += 1
        host_country_match_counter[row["country_name"]] += 1
    venue_atlas = {
        "cities": [
            {"city": city, "country": country, "matches": count}
            for (city, country), count in city_counter.most_common(8)
        ],
        "stadiums": [
            {
                "stadium": stadium_lookup[stadium_id]["stadium_name"],
                "city": stadium_lookup[stadium_id]["city_name"],
                "country": stadium_lookup[stadium_id]["country_name"],
                "matches": count,
            }
            for stadium_id, count in stadium_counter.most_common(8)
        ],
        "hosts": [
            {"country": country, "matches": count}
            for country, count in host_country_match_counter.most_common(8)
        ],
    }

    performance_rank = {
        "champions": 8,
        "final": 7,
        "runners-up": 7,
        "runner-up": 7,
        "third place": 6,
        "fourth place": 5,
        "semi-finals": 4,
        "quarter-finals": 3,
        "quarter-final": 3,
        "quater-finals": 3,
        "round of 16": 2,
        "second group stage": 1,
        "group stage": 0,
    }
    team_stats = defaultdict(
        lambda: {
            "appearances": 0,
            "matches": 0,
            "wins": 0,
            "goalsFor": 0,
            "bestPerformance": "group stage",
            "bestRank": -1,
            "teamId": "",
        }
    )
    for row in qualified_teams:
        stats = team_stats[row["team_name"]]
        stats["appearances"] += 1
        stats["teamId"] = row["team_id"]
        performance = normalize_performance(row["performance"])
        current_rank = performance_rank.get(performance, -1)
        if current_rank > stats["bestRank"]:
            stats["bestRank"] = current_rank
            stats["bestPerformance"] = performance
    for row in team_appearances:
        stats = team_stats[row["team_name"]]
        stats["matches"] += 1
        stats["wins"] += to_int(row["win"])
        stats["goalsFor"] += to_int(row["goals_for"])

    podium_counter = defaultdict(lambda: {"titles": 0, "runnersUp": 0, "thirds": 0, "topFour": 0})
    for row in tournament_standings:
        if to_int(row["position"]) <= 4:
            podium_counter[row["team_name"]]["topFour"] += 1
        if row["position"] == "1":
            podium_counter[row["team_name"]]["titles"] += 1
        elif row["position"] == "2":
            podium_counter[row["team_name"]]["runnersUp"] += 1
        elif row["position"] == "3":
            podium_counter[row["team_name"]]["thirds"] += 1

    team_dynasties = sorted(
        [
            {
                "team": team,
                "appearances": stats["appearances"],
                "matches": stats["matches"],
                "wins": stats["wins"],
                "goalsFor": stats["goalsFor"],
                "bestPerformance": stats["bestPerformance"],
                "titles": podium_counter[team]["titles"],
                "topFour": podium_counter[team]["topFour"],
            }
            for team, stats in team_stats.items()
        ],
        key=lambda item: (item["titles"], item["topFour"], item["appearances"], item["wins"]),
        reverse=True,
    )[:10]

    confed_stats = defaultdict(lambda: {"teams": set(), "appearances": 0, "matches": 0})
    for row in qualified_teams:
        team = team_lookup.get(row["team_id"], {})
        confed = team.get("confederation_code", "UNK")
        confed_stats[confed]["teams"].add(row["team_name"])
        confed_stats[confed]["appearances"] += 1
    for row in team_appearances:
        team = team_lookup.get(row["team_id"], {})
        confed = team.get("confederation_code", "UNK")
        confed_stats[confed]["matches"] += 1
    confederation_reach = sorted(
        [
            {
                "confederation": confed,
                "name": confed_lookup.get(team_lookup.get(next(iter([t["teamId"] for n, t in team_stats.items() if team_lookup.get(t["teamId"], {}).get("confederation_code") == confed]), ""), {}).get("confederation_id", ""), {}).get("confederation_name", confed),
                "teams": len(values["teams"]),
                "appearances": values["appearances"],
                "matches": values["matches"],
            }
            for confed, values in confed_stats.items()
        ],
        key=lambda item: (item["appearances"], item["matches"]),
        reverse=True,
    )
    # Repair names directly from confederations lookup when possible.
    confed_name_by_code = {row["confederation_code"]: row["confederation_name"] for row in confederations}
    for item in confederation_reach:
        item["name"] = confed_name_by_code.get(item["confederation"], item["name"])

    goal_counter = defaultdict(lambda: {"goals": 0, "team": "", "tournaments": set()})
    for row in goals:
        stats = goal_counter[row["player_id"]]
        stats["goals"] += 1
        stats["team"] = row["player_team_name"] or row["team_name"]
        stats["tournaments"].add(row["tournament_id"])
        stats["name"] = player_name(row)
    top_scorers = sorted(
        [
            {
                "player": value["name"],
                "team": value["team"],
                "goals": value["goals"],
                "tournaments": len(value["tournaments"]),
            }
            for value in goal_counter.values()
        ],
        key=lambda item: (item["goals"], item["tournaments"]),
        reverse=True,
    )[:10]

    appearance_counter = defaultdict(lambda: {"matches": 0, "team": "", "tournaments": set(), "name": ""})
    for row in player_appearances:
        stats = appearance_counter[row["player_id"]]
        stats["matches"] += 1
        stats["team"] = row["team_name"]
        stats["tournaments"].add(row["tournament_id"])
        stats["name"] = player_name(row)
    top_appearances = sorted(
        [
            {
                "player": value["name"],
                "team": value["team"],
                "matches": value["matches"],
                "tournaments": len(value["tournaments"]),
            }
            for value in appearance_counter.values()
        ],
        key=lambda item: (item["matches"], item["tournaments"]),
        reverse=True,
    )[:10]

    squad_tournaments = defaultdict(lambda: {"tournaments": set(), "position": Counter(), "name": "", "team": ""})
    for row in squads:
        stats = squad_tournaments[row["player_id"]]
        stats["tournaments"].add(row["tournament_id"])
        stats["position"][row["position_code"] or row["position_name"]] += 1
        stats["name"] = player_name(row)
        stats["team"] = row["team_name"]
    squad_evergreens = sorted(
        [
            {
                "player": value["name"],
                "team": value["team"],
                "tournaments": len(value["tournaments"]),
                "position": value["position"].most_common(1)[0][0],
            }
            for value in squad_tournaments.values()
        ],
        key=lambda item: (item["tournaments"], item["player"]),
        reverse=True,
    )[:10]

    award_counter = defaultdict(lambda: {"awards": 0, "team": "", "items": [], "name": ""})
    for row in award_winners:
        stats = award_counter[row["player_id"]]
        stats["awards"] += 1
        stats["team"] = row["team_name"]
        stats["items"].append(f'{tournament_lookup[row["tournament_id"]]["year"]} {row["award_name"]}')
        stats["name"] = player_name(row)
    award_leaders = sorted(
        [
            {
                "player": value["name"],
                "team": value["team"],
                "awards": value["awards"],
                "highlights": value["items"][:3],
            }
            for value in award_counter.values()
        ],
        key=lambda item: (item["awards"], item["player"]),
        reverse=True,
    )[:10]

    manager_stats = defaultdict(lambda: {"matches": 0, "tournaments": set(), "teams": set(), "country": "", "name": ""})
    for row in manager_appointments:
        stats = manager_stats[row["manager_id"]]
        stats["tournaments"].add(row["tournament_id"])
        stats["teams"].add(row["team_name"])
        stats["country"] = row["country_name"]
        stats["name"] = manager_name(row)
    for row in manager_appearances:
        stats = manager_stats[row["manager_id"]]
        stats["matches"] += 1
        stats["teams"].add(row["team_name"])
        stats["country"] = row["country_name"]
        stats["name"] = manager_name(row)
    manager_legends = sorted(
        [
            {
                "manager": value["name"],
                "country": value["country"],
                "matches": value["matches"],
                "tournaments": len(value["tournaments"]),
                "teams": len(value["teams"]),
            }
            for value in manager_stats.values()
        ],
        key=lambda item: (item["matches"], item["tournaments"], item["teams"]),
        reverse=True,
    )[:10]

    referee_stats = defaultdict(lambda: {"matches": 0, "tournaments": set(), "country": "", "confed": "", "name": ""})
    for row in referee_appointments:
        stats = referee_stats[row["referee_id"]]
        stats["tournaments"].add(row["tournament_id"])
        stats["country"] = row["country_name"]
        stats["confed"] = row["confederation_code"]
        stats["name"] = ref_name(row)
    for row in referee_appearances:
        stats = referee_stats[row["referee_id"]]
        stats["matches"] += 1
        stats["country"] = row["country_name"]
        stats["confed"] = row["confederation_code"]
        stats["name"] = ref_name(row)
    referee_legends = sorted(
        [
            {
                "referee": value["name"],
                "country": value["country"],
                "confederation": value["confed"],
                "matches": value["matches"],
                "tournaments": len(value["tournaments"]),
            }
            for value in referee_stats.values()
        ],
        key=lambda item: (item["matches"], item["tournaments"]),
        reverse=True,
    )[:10]

    award_archive = []
    winners_by_award = Counter(row["award_id"] for row in award_winners)
    for row in awards:
        if not winners_by_award[row["award_id"]]:
            continue
        award_archive.append(
            {
                "award": row["award_name"],
                "introduced": to_int(row["year_introduced"]),
                "winners": winners_by_award[row["award_id"]],
                "description": row["award_description"],
            }
        )
    award_archive.sort(key=lambda item: (item["winners"], -item["introduced"]), reverse=True)

    goals_by_tournament = Counter(row["tournament_id"] for row in goals)
    top_goal_tournaments = [
        {
            "year": to_int(tournament_lookup[tournament_id]["year"]),
            "goals": count,
            "matches": sum(1 for match in matches if match["tournament_id"] == tournament_id),
        }
        for tournament_id, count in goals_by_tournament.most_common(8)
    ]

    shootout_matches = [
        {
            "year": to_int(tournament_lookup[row["tournament_id"]]["year"]),
            "match": row["match_name"],
            "stage": row["stage_name"],
            "score": row["score_penalties"],
        }
        for row in matches
        if row["penalty_shootout"] == "1"
    ][-10:]

    booking_by_match = defaultdict(lambda: {"cards": 0, "reds": 0, "match": "", "year": 0, "stage": ""})
    for row in bookings:
        stats = booking_by_match[row["match_id"]]
        stats["cards"] += to_int(row["yellow_card"]) + to_int(row["second_yellow_card"]) + to_int(row["red_card"])
        stats["reds"] += to_int(row["sending_off"]) + to_int(row["red_card"])
        stats["match"] = row["match_name"]
        stats["year"] = to_int(tournament_lookup[row["tournament_id"]]["year"])
        stats["stage"] = row["stage_name"]
    card_heavy_matches = sorted(
        booking_by_match.values(),
        key=lambda item: (item["cards"], item["reds"], item["year"]),
        reverse=True,
    )[:8]

    sub_by_tournament = Counter(row["tournament_id"] for row in substitutions)
    substitution_eras = sorted(
        [
            {
                "year": to_int(tournament_lookup[tournament_id]["year"]),
                "subs": count,
                "perMatch": round(count / max(1, sum(1 for match in matches if match["tournament_id"] == tournament_id)), 2),
            }
            for tournament_id, count in sub_by_tournament.items()
        ],
        key=lambda item: item["year"],
    )

    minute_goals = []
    for row in goals:
        minute = to_int(row["minute_regulation"]) + to_int(row["minute_stoppage"])
        minute_goals.append(
            {
                "minute": minute,
                "label": row["minute_label"],
                "player": player_name(row),
                "match": row["match_name"],
                "year": to_int(tournament_lookup[row["tournament_id"]]["year"]),
            }
        )
    minute_goals.sort(key=lambda item: item["minute"])
    milestone_goals = {
        "earliest": minute_goals[:5],
        "latest": minute_goals[-5:][::-1],
    }

    stage_evolution = []
    for tournament_id, rows in defaultdict(list, ((tid, []) for tid in [])):  # no-op to keep typing happy
        pass
    stages_by_tournament = defaultdict(list)
    for row in tournament_stages:
        stages_by_tournament[row["tournament_id"]].append(row)
    for tournament in tournaments:
        stage_rows = stages_by_tournament[tournament["tournament_id"]]
        stage_evolution.append(
            {
                "year": to_int(tournament["year"]),
                "stages": len(stage_rows),
                "groupStages": sum(1 for row in stage_rows if row["group_stage"] == "1"),
                "knockoutStages": sum(1 for row in stage_rows if row["knockout_stage"] == "1"),
                "groups": sum(1 for row in groups if row["tournament_id"] == tournament["tournament_id"]),
                "teams": to_int(tournament["count_teams"]),
            }
        )

    group_dominance = sorted(
        [
            {
                "year": to_int(tournament_lookup[row["tournament_id"]]["year"]),
                "team": row["team_name"],
                "group": row["group_name"],
                "points": to_int(row["points"]),
                "goalDiff": to_int(row["goal_difference"]),
                "goalsFor": to_int(row["goals_for"]),
                "advanced": row["advanced"] == "1",
            }
            for row in group_standings
        ],
        key=lambda item: (item["points"], item["goalDiff"], item["goalsFor"]),
        reverse=True,
    )[:10]

    podium_map = sorted(
        [
            {
                "team": team,
                "titles": values["titles"],
                "runnersUp": values["runnersUp"],
                "thirds": values["thirds"],
                "topFour": values["topFour"],
            }
            for team, values in podium_counter.items()
        ],
        key=lambda item: (item["topFour"], item["titles"], item["runnersUp"]),
        reverse=True,
    )[:10]

    archive = f"""// Auto-generated from .cache/worldcup/data-csv by scripts/build_worldcup_archive.py
export const archiveOverview = {compact_dump(archive_overview)};
export const archiveFormatEvolution = {compact_dump(format_evolution)};
export const archiveHostStory = {compact_dump(host_story)};
export const archiveHostSummary = {compact_dump(host_summary)};
export const archiveVenueAtlas = {compact_dump(venue_atlas)};
export const archiveTeamDynasties = {compact_dump(team_dynasties)};
export const archiveConfederationReach = {compact_dump(confederation_reach)};
export const archiveTopScorers = {compact_dump(top_scorers)};
export const archiveTopAppearances = {compact_dump(top_appearances)};
export const archiveSquadEvergreens = {compact_dump(squad_evergreens)};
export const archiveAwardLeaders = {compact_dump(award_leaders)};
export const archiveManagerLegends = {compact_dump(manager_legends)};
export const archiveRefereeLegends = {compact_dump(referee_legends)};
export const archiveAwards = {compact_dump(award_archive)};
export const archiveGoalTournaments = {compact_dump(top_goal_tournaments)};
export const archiveShootoutMatches = {compact_dump(shootout_matches)};
export const archiveCardHeavyMatches = {compact_dump(card_heavy_matches)};
export const archiveSubstitutionEras = {compact_dump(substitution_eras)};
export const archiveMilestoneGoals = {compact_dump(milestone_goals)};
export const archiveStageEvolution = {compact_dump(stage_evolution)};
export const archiveGroupDominance = {compact_dump(group_dominance)};
export const archivePodiumMap = {compact_dump(podium_map)};
"""

    OUTPUT.write_text(archive, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
