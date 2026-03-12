#!/usr/bin/env python3
"""Validate a provider sample payload against the site's matchday contract."""

from __future__ import annotations

import json
import sys
from pathlib import Path


REQUIRED_ROOT_KEYS = {"matches", "standings", "eventsByMatch", "statsByMatch"}
REQUIRED_MATCH_KEYS = {"id", "starting_at", "state"}
REQUIRED_STANDINGS_KEYS = {"group", "participant", "details", "points"}


def classify_phase(state: str) -> str:
    state = str(state).lower()
    if state in {"live", "inplay", "in_play", "1h", "2h", "ht", "et"}:
        return "in_match"
    if state in {"ft", "aet", "pen", "finished", "full_time", "after_extra_time"}:
        return "post_match"
    return "pre_match"


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/validate_matchday_provider.py <payload.json>")
        return 1

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"Missing file: {path}")
        return 1

    payload = json.loads(path.read_text())
    ok = True

    missing_root = sorted(REQUIRED_ROOT_KEYS - payload.keys())
    if missing_root:
      print("Missing root keys:", ", ".join(missing_root))
      ok = False

    matches = payload.get("matches", [])
    if not matches:
      print("No matches found in payload.")
      ok = False
    else:
      for index, match in enumerate(matches[:3], start=1):
        missing = sorted(REQUIRED_MATCH_KEYS - match.keys())
        if missing:
          print(f"Match #{index} missing keys: {', '.join(missing)}")
          ok = False

    standings = payload.get("standings", [])
    if not standings:
      print("No standings rows found in payload.")
      ok = False
    else:
      for index, row in enumerate(standings[:3], start=1):
        missing = sorted(REQUIRED_STANDINGS_KEYS - row.keys())
        if missing:
          print(f"Standings row #{index} missing keys: {', '.join(missing)}")
          ok = False

    if ok:
      phase_counts = {"pre_match": 0, "in_match": 0, "post_match": 0}
      for match in matches:
          phase_counts[classify_phase(match.get("state"))] += 1
      print("Provider payload looks structurally usable for the matchday adapter.")
      print(f"Matches: {len(matches)}")
      print(
          "Phases: "
          f"pre_match={phase_counts['pre_match']}, "
          f"in_match={phase_counts['in_match']}, "
          f"post_match={phase_counts['post_match']}"
      )
      print(f"Standings rows: {len(standings)}")
      print(f"Event match ids: {len(payload.get('eventsByMatch', {}))}")
      print(f"Stats match ids: {len(payload.get('statsByMatch', {}))}")
      return 0

    print("Provider payload is not ready yet.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
