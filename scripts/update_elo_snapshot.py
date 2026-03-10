#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path


@dataclass
class EloRow:
    rank: int
    team: str
    elo: int
    change: int | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Parse a saved eloratings.net HTML snapshot into a normalized JSON file "
            "that the site can consume."
        )
    )
    parser.add_argument(
        "input",
        type=Path,
        help="Path to a locally saved HTML snapshot from eloratings.net.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/elo/latest.json"),
        help="Output JSON path. Default: data/elo/latest.json",
    )
    parser.add_argument(
        "--source-url",
        default="https://eloratings.net/",
        help="Source URL to store in the output metadata.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    html = args.input.read_text(encoding="utf-8", errors="ignore")
    rows = extract_rows(html)

    payload = {
        "source_url": args.source_url,
        "source_file": str(args.input),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(rows),
        "rows": [asdict(row) for row in rows],
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Wrote {args.output} with {len(rows)} rows.")
    return 0


def extract_rows(html: str) -> list[EloRow]:
    cleaned = normalize_html(html)

    # This parser intentionally targets a saved HTML table snapshot.
    # If the upstream page structure changes, update this regex first.
    table_rows = re.findall(r"<tr[^>]*>(.*?)</tr>", cleaned, flags=re.IGNORECASE)
    parsed_rows: list[EloRow] = []

    for row_html in table_rows:
        cells = [
            strip_tags(cell)
            for cell in re.findall(
                r"<t[dh][^>]*>(.*?)</t[dh]>", row_html, flags=re.IGNORECASE
            )
        ]
        if len(cells) < 3:
            continue

        rank = parse_int(cells[0])
        elo = parse_int(cells[2])
        if rank is None or elo is None:
            continue

        team = cells[1].strip()
        if not team:
            continue

        change = parse_int(cells[3]) if len(cells) > 3 else None
        parsed_rows.append(EloRow(rank=rank, team=team, elo=elo, change=change))

    return parsed_rows


def normalize_html(html: str) -> str:
    return re.sub(r"\s+", " ", html)


def strip_tags(value: str) -> str:
    no_tags = re.sub(r"<[^>]+>", "", value)
    return unescape(no_tags).strip()


def parse_int(value: str) -> int | None:
    match = re.search(r"-?\d+", value.replace(",", ""))
    if not match:
        return None
    return int(match.group())


if __name__ == "__main__":
    raise SystemExit(main())
