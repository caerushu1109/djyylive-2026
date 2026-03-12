#!/usr/bin/env python3

import json
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_elo_trends import build_trends


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_HISTORY_DIR = ROOT / "public" / "data" / "elo-history"
ARCHIVE_HISTORY_DIR = ROOT / "data" / "elo-history"
TEAMS_DIR = ARCHIVE_HISTORY_DIR / "teams"
MATCHES_PATH = ARCHIVE_HISTORY_DIR / "matches.json"
INDEX_PATH = PUBLIC_HISTORY_DIR / "index.json"
TEAM_DICT_URL = "https://eloratings.net/en.teams.tsv"
SUCCESSOR_URL = "https://eloratings.net/teams.tsv"
BASE_URL = "https://eloratings.net"
MAX_WORKERS = 6


def fetch_text(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "DJYY-WorldCup/1.0 (+historical archive from eloratings.net)",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="ignore"), response.headers.get("Last-Modified")


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


def parse_number(value):
    text = str(value or "").strip().replace("−", "-").replace("–", "-")
    if text in {"", "-"}:
        return None
    try:
        return int(text)
    except ValueError:
        try:
            return float(text)
        except ValueError:
            return text


def parse_team_dictionary(tsv_text):
    teams = []
    for line in tsv_text.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        code = parts[0].strip()
        if code.endswith("_loc"):
            continue
        names = [value.strip() for value in parts[1:] if value.strip()]
        if not names:
            continue
        teams.append(
            {
                "code": code,
                "name": names[0],
                "aliases": names,
                "slug": page_name(names[0]),
            }
        )
    return teams


def parse_successors(tsv_text):
    mapping = {}
    for line in tsv_text.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) >= 2:
            mapping[parts[0].strip()] = parts[1].strip()
    return mapping


def parse_match_line(line):
    fields = line.split("\t")
    if len(fields) < 16:
        return None
    year = parse_number(fields[0])
    month = parse_number(fields[1])
    day = parse_number(fields[2])
    return {
        "date": {
            "year": year,
            "month": month,
            "day": day,
            "iso": f"{int(year):04d}-{int(month):02d}-{int(day):02d}" if year and month and day else None,
        },
        "homeCode": fields[3],
        "awayCode": fields[4],
        "homeGoals": parse_number(fields[5]),
        "awayGoals": parse_number(fields[6]),
        "tournamentCode": fields[7],
        "venueCode": fields[8] or None,
        "ratingChange": parse_number(fields[9]),
        "homeEloAfter": parse_number(fields[10]),
        "awayEloAfter": parse_number(fields[11]),
        "homeRankChange": parse_number(fields[12]),
        "awayRankChange": parse_number(fields[13]),
        "homeRankAfter": parse_number(fields[14]),
        "awayRankAfter": parse_number(fields[15]),
        "raw": fields,
    }


def fetch_team_history(team):
    url = f"{BASE_URL}/{team['slug']}.tsv"
    try:
        body, last_modified = fetch_text(url)
    except urllib.error.HTTPError as error:
        return {
            "code": team["code"],
            "name": team["name"],
            "slug": team["slug"],
            "ok": False,
            "status": error.code,
            "matches": [],
        }

    matches = [parsed for parsed in (parse_match_line(line) for line in body.splitlines()) if parsed]
    return {
        "code": team["code"],
        "name": team["name"],
        "aliases": team["aliases"],
        "slug": team["slug"],
        "ok": True,
        "lastModified": last_modified,
        "matchCount": len(matches),
        "matches": matches,
    }


def match_key(match):
    return "|".join(
        [
            match["date"]["iso"] or "",
            match["homeCode"] or "",
            match["awayCode"] or "",
            str(match["homeGoals"]),
            str(match["awayGoals"]),
            match["tournamentCode"] or "",
            match["venueCode"] or "",
        ]
    )


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def main():
    team_text, _ = fetch_text(TEAM_DICT_URL)
    successor_text, _ = fetch_text(SUCCESSOR_URL)
    teams = parse_team_dictionary(team_text)
    successors = parse_successors(successor_text)

    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetch_team_history, team): team for team in teams}
        for future in as_completed(futures):
            results.append(future.result())
            time.sleep(0.02)

    results.sort(key=lambda item: item["name"])

    unique_matches = {}
    team_index = []
    team_payloads = {}
    for item in results:
        payload = {
            "code": item["code"],
            "name": item["name"],
            "aliases": item.get("aliases", []),
            "slug": item["slug"],
            "successorCode": successors.get(item["code"]),
            "ok": item["ok"],
            "derived": False,
            "lastModified": item.get("lastModified"),
            "matchCount": item.get("matchCount", 0),
            "matches": item["matches"],
        }
        team_payloads[item["code"]] = payload
        for match in item["matches"]:
            unique_matches.setdefault(match_key(match), match)

    matches = sorted(
        unique_matches.values(),
        key=lambda item: (
            item["date"]["iso"] or "",
            item["homeCode"] or "",
            item["awayCode"] or "",
        ),
    )

    for code, payload in team_payloads.items():
        if payload["matchCount"] > 0:
            continue
        reconstructed = [
            match
            for match in matches
            if match["homeCode"] == code or match["awayCode"] == code
        ]
        if reconstructed:
            payload["matches"] = reconstructed
            payload["matchCount"] = len(reconstructed)
            payload["derived"] = True

    for payload in sorted(team_payloads.values(), key=lambda item: item["name"]):
        write_json(TEAMS_DIR / f"{payload['slug']}.json", payload)
        team_index.append(
            {
                "code": payload["code"],
                "name": payload["name"],
                "slug": payload["slug"],
                "successorCode": payload.get("successorCode"),
                "ok": payload["ok"],
                "derived": payload["derived"],
                "matchCount": payload["matchCount"],
            }
        )

    index_payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "eloratings.net",
        "teamDictionaryUrl": TEAM_DICT_URL,
        "successorUrl": SUCCESSOR_URL,
        "teamCount": len(team_index),
        "successfulTeams": sum(1 for item in team_index if item["ok"]),
        "failedTeams": sum(1 for item in team_index if not item["ok"]),
        "derivedTeams": sum(1 for item in team_index if item["derived"]),
        "uniqueMatchCount": len(matches),
        "teams": team_index,
    }

    write_json(INDEX_PATH, index_payload)
    write_json(MATCHES_PATH, {"updatedAt": index_payload["updatedAt"], "matches": matches})
    if (ROOT / "public" / "data" / "elo.json").exists():
        build_trends()


if __name__ == "__main__":
    main()
