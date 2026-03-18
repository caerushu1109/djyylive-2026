#!/usr/bin/env python3

import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_elo_trends import build_trends
from generate_predictions import build_predictions, write_predictions


ELO_PATH = ROOT / "public" / "data" / "elo.json"
WORLD_CUP_TEAMS_PATH = ROOT / "public" / "data" / "worldcup-teams.json"
TEAM_META_PATH = ROOT / "src" / "lib" / "team-meta.js"
WORLD_TSV_URL = "https://eloratings.net/World.tsv"
TEAM_DICT_URL = "https://eloratings.net/en.teams.tsv"
SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football"
WORLD_CUP_FIXTURES_URL = f"{SPORTMONKS_BASE_URL}/fixtures/between/2026-06-11/2026-07-19"

PLAYOFF_NAME_MAP = {
    "Den": "Denmark",
    "Mkd": "North Macedonia",
    "Cze": "Czechia",
    "Irl": "Ireland",
    "Ita": "Italy",
    "Nir": "Northern Ireland",
    "Wal": "Wales",
    "BiH": "Bosnia and Herzegovina",
    "Tur": "Turkey",
    "Rou": "Romania",
    "Svk": "Slovakia",
    "Kos": "Kosovo",
    "Ukr": "Ukraine",
    "Swe": "Sweden",
    "Pol": "Poland",
    "Alb": "Albania",
    "Bol": "Bolivia",
    "Sur": "Suriname",
    "Irq": "Iraq",
    "Ncl": "New Caledonia",
    "Jam": "Jamaica",
    "Cod": "DR Congo",
}

DIRECT_NAME_ALIASES = {
    "Korea Republic": "South Korea",
    "Curacao": "Curaçao",
    "Côte d'Ivoire": "Ivory Coast",
    "Cape Verde Islands": "Cape Verde",
}


def load_local_env():
    env_path = ROOT / ".env.local"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        text = line.strip()
        if not text or text.startswith("#") or "=" not in text:
            continue
        key, value = text.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())

SPECIAL_FLAGS = {
    "EN": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "WA": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "SC": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "NI": "🇬🇧",
    "XK": "🇽🇰",
}


def fetch_text(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "DJYY-WorldCup/1.0 (+https://eloratings.net/ source fetch)",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="ignore"), response.headers.get("Last-Modified")


def parse_team_dictionary(tsv_text):
    teams = {}
    for line in tsv_text.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        code = parts[0].strip()
        names = [value.strip() for value in parts[1:] if value.strip()]
        if names:
            teams[code] = names[0]
    return teams


def fetch_world_cup_participants():
    token = os.environ.get("SPORTMONKS_API_TOKEN")
    if not token:
        return []
    url = f"{WORLD_CUP_FIXTURES_URL}?api_token={token}&include=participants"
    body, _ = fetch_text(url)
    payload = json.loads(body)
    participants = []
    seen = set()
    for match in payload.get("data", []):
        for participant in match.get("participants", []):
            name = str(participant.get("name") or "").strip()
            if name and name not in seen:
                seen.add(name)
                participants.append(name)
    return participants


def build_placeholder_entry(name, rankings_by_original_name, team_meta):
    candidates = []
    for part in name.split("/"):
        candidate_name = PLAYOFF_NAME_MAP.get(part, part)
        candidate = rankings_by_original_name.get(candidate_name)
        if candidate:
            candidates.append(candidate)

    if not candidates:
        return None

    avg_elo = round(sum(item["elo"] for item in candidates) / len(candidates))
    return {
        "code": name,
        "flag": team_meta.get(name, {}).get("flag", "🏳️"),
        "name": team_meta.get(name, {}).get("shortName", name),
        "originalName": name,
        "elo": avg_elo,
        "placeholder": True,
    }


def parse_team_meta_js():
    raw = TEAM_META_PATH.read_text(encoding="utf-8")
    pattern = re.compile(
        r'^\s*(?:"(?P<quoted_name>[^"]+)"|(?P<bare_name>[A-Za-z][A-Za-z0-9\s\'\-\./&]+))\s*:\s*\{\s*shortName:\s*"(?P<short>[^"]+)",\s*flag:\s*"(?P<flag>[^"]+)"\s*\}',
        re.MULTILINE,
    )
    return {
        (match.group("quoted_name") or match.group("bare_name")).strip(): {
            "shortName": match.group("short"),
            "flag": match.group("flag"),
        }
        for match in pattern.finditer(raw)
    }


def country_code_to_flag(code):
    code = (code or "").strip().upper()
    if code in SPECIAL_FLAGS:
        return SPECIAL_FLAGS[code]
    if len(code) != 2 or not code.isalpha():
        return "🏳️"
    base = 127397
    return chr(base + ord(code[0])) + chr(base + ord(code[1]))


def normalize_width(rank, total):
    if total <= 1:
        return 100
    return max(6, round(((total - rank + 1) / total) * 100))


def normalize_elo_width(elo, min_elo, max_elo):
    if max_elo <= min_elo:
        return 100
    return max(6, round(((elo - min_elo) / (max_elo - min_elo)) * 100))


def build_elo_snapshot(world_tsv, team_names, team_meta, last_modified=None):
    rankings = []
    for line in world_tsv.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        rank = int(parts[1])
        code = parts[2].strip()
        elo = int(float(parts[3]))
        english_name = team_names.get(code, code)
        meta = team_meta.get(english_name, {})
        rankings.append(
            {
                "rank": rank,
                "code": code,
                "flag": meta.get("flag") or country_code_to_flag(code),
                "name": meta.get("shortName") or english_name,
                "originalName": english_name,
                "elo": elo,
                "placeholder": False,
            }
        )

    rankings_by_original_name = {item["originalName"]: item for item in rankings}
    world_cup_participants = fetch_world_cup_participants()
    filtered_rankings = []

    if world_cup_participants:
        included = set()
        for name in world_cup_participants:
            direct = rankings_by_original_name.get(DIRECT_NAME_ALIASES.get(name, name))
            if direct:
                filtered_rankings.append(
                    {
                        **direct,
                        "name": team_meta.get(name, {}).get("shortName", direct["name"]),
                        "flag": team_meta.get(name, {}).get("flag", direct["flag"]),
                        "originalName": name,
                    }
                )
                included.add(name)
                continue

            placeholder = build_placeholder_entry(name, rankings_by_original_name, team_meta)
            if placeholder:
                filtered_rankings.append(placeholder)
                included.add(name)

        rankings = filtered_rankings

    rankings.sort(key=lambda item: item["elo"], reverse=True)
    total = len(rankings)
    max_elo = max((item["elo"] for item in rankings), default=0)
    min_elo = min((item["elo"] for item in rankings), default=0)
    for index, item in enumerate(rankings, start=1):
        item["rank"] = index
        item["width"] = normalize_elo_width(item["elo"], min_elo, max_elo)

    updated_at = datetime.now(timezone.utc).isoformat()
    if last_modified:
        try:
            updated_at = datetime.strptime(last_modified, "%a, %d %b %Y %H:%M:%S %Z").replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            pass

    WORLD_CUP_TEAMS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with WORLD_CUP_TEAMS_PATH.open("w", encoding="utf-8") as file:
        json.dump(
            {
                "updatedAt": updated_at,
                "source": "sportmonks",
                "teams": [
                    {
                        "name": item["originalName"],
                        "displayName": item["name"],
                        "flag": item["flag"],
                        "placeholder": item.get("placeholder", False),
                    }
                    for item in rankings
                ],
            },
            file,
            ensure_ascii=False,
            indent=2,
        )
        file.write("\n")

    return {
        "updatedAt": updated_at,
        "source": "eloratings.net",
        "sourceUrl": WORLD_TSV_URL,
        "method": "基于 eloratings.net 的 World.tsv 每日抓取，并按 SportMonks 的 2026 世界杯 48 队名单过滤生成。",
        "rankings": rankings,
    }


def write_elo_snapshot(snapshot):
    ELO_PATH.parent.mkdir(parents=True, exist_ok=True)
    with ELO_PATH.open("w", encoding="utf-8") as file:
        json.dump(snapshot, file, ensure_ascii=False, indent=2)
        file.write("\n")


def main():
    load_local_env()
    world_tsv, last_modified = fetch_text(WORLD_TSV_URL)
    team_tsv, _ = fetch_text(TEAM_DICT_URL)
    team_names = parse_team_dictionary(team_tsv)
    team_meta = parse_team_meta_js()
    snapshot = build_elo_snapshot(world_tsv, team_names, team_meta, last_modified=last_modified)
    write_elo_snapshot(snapshot)
    predictions = build_predictions(snapshot)
    write_predictions(predictions)
    if (ROOT / "public" / "data" / "elo-history" / "index.json").exists():
        build_trends()


if __name__ == "__main__":
    main()
