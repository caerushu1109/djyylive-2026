#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ELO_PATH = ROOT / "public" / "data" / "elo.json"
HISTORY_INDEX_PATH = ROOT / "public" / "data" / "elo-history" / "index.json"
HISTORY_TEAMS_DIR = ROOT / "public" / "data" / "elo-history" / "teams"
TRENDS_PATH = ROOT / "public" / "data" / "elo-trends.json"
ANCHOR_COUNT = 7
TREND_COLORS = [
    "#c9a227",
    "#4da6ff",
    "#2ec4b6",
    "#e63946",
    "#f4a261",
    "#7bd389",
    "#9bbcff",
    "#ff8fab",
]


def page_name(text):
    value = text or ""
    replacements = {
        "à": "a",
        "á": "a",
        "â": "a",
        "ã": "a",
        "ä": "a",
        "å": "a",
        "ç": "c",
        "è": "e",
        "é": "e",
        "ê": "e",
        "ë": "e",
        "ì": "i",
        "í": "i",
        "î": "i",
        "ï": "i",
        "ò": "o",
        "ó": "o",
        "ô": "o",
        "õ": "o",
        "ö": "o",
        "ù": "u",
        "ú": "u",
        "û": "u",
        "ü": "u",
        "ñ": "n",
    }
    for source, target in replacements.items():
        value = value.replace(source, target).replace(source.upper(), target.upper())
    return value.replace(" ", "_")


def read_json(path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def team_file_path(team):
    slug = page_name(team.get("originalName") or team.get("name"))
    return HISTORY_TEAMS_DIR / f"{slug}.json"


def build_anchor_years(updated_at):
    current_year = int(str(updated_at)[:4])
    start_year = current_year - (ANCHOR_COUNT - 1) * 2
    return [start_year + index * 2 for index in range(ANCHOR_COUNT)]


def elo_after_match(match, team_code):
    if match.get("homeCode") == team_code:
        return match.get("homeEloAfter")
    if match.get("awayCode") == team_code:
        return match.get("awayEloAfter")
    return None


def build_points(matches, team_code, current_elo, anchor_years):
    sorted_matches = sorted(matches, key=lambda item: item.get("date", {}).get("iso") or "")
    points = []
    latest_known = None

    for year in anchor_years:
      for match in sorted_matches:
          iso = match.get("date", {}).get("iso")
          if not iso:
              continue
          if iso[:4] > str(year):
              break
          elo = elo_after_match(match, team_code)
          if elo is not None:
              latest_known = int(elo)

      if year == anchor_years[-1]:
          latest_known = int(current_elo)

      points.append(
          {
              "label": str(year),
              "elo": int(latest_known if latest_known is not None else current_elo),
          }
      )

    return points


def build_trends():
    elo_snapshot = read_json(ELO_PATH)
    index = read_json(HISTORY_INDEX_PATH) if HISTORY_INDEX_PATH.exists() else {"teams": []}
    index_by_code = {team["code"]: team for team in index.get("teams", [])}
    anchor_years = build_anchor_years(elo_snapshot.get("updatedAt", "2026-01-01"))

    teams = []
    rankings = elo_snapshot.get("rankings", [])
    for index, team in enumerate(rankings):
        color = TREND_COLORS[index % len(TREND_COLORS)]
        history_path = team_file_path(team)
        history_payload = read_json(history_path) if history_path.exists() else None
        matches = history_payload.get("matches", []) if history_payload else []
        index_team = index_by_code.get(team.get("code"), {})
        teams.append(
            {
                "id": page_name(team.get("originalName") or team.get("name")).lower(),
                "rank": team.get("rank"),
                "code": team.get("code"),
                "name": team.get("name"),
                "originalName": team.get("originalName") or team.get("name"),
                "flag": team.get("flag"),
                "elo": team.get("elo"),
                "color": color,
                "matchCount": history_payload.get("matchCount") if history_payload else index_team.get("matchCount", 0),
                "points": build_points(matches, team.get("code"), team.get("elo"), anchor_years),
            }
        )

    payload = {
        "updatedAt": elo_snapshot.get("updatedAt"),
        "source": "elo-history",
        "method": "基于本地 Elo 历史资料库按 2 年间隔抽样生成走势，最后一个节点使用当前最新 Elo 快照。",
        "teams": teams,
    }
    write_json(TRENDS_PATH, payload)
    return payload


def main():
    build_trends()


if __name__ == "__main__":
    main()
