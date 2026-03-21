#!/usr/bin/env python3
"""
Backtest ELO match prediction model against 964 World Cup matches (1930-2022).

Uses real pre-match ELO ratings from eloratings.net historical dataset (51K+ matches).
Grid searches over (divisor, drawBase, hostBonus) to minimize Brier Score.

Output: scripts/backtest_results.json
"""

import csv
import json
import math
import os
from datetime import datetime

# ── Host countries ───────────────────────────────────────────────────────

WC_HOSTS = {
    1930: ["Uruguay"], 1934: ["Italy"], 1938: ["France"],
    1950: ["Brazil"], 1954: ["Switzerland"], 1958: ["Sweden"],
    1962: ["Chile"], 1966: ["England"], 1970: ["Mexico"],
    1974: ["West Germany", "Germany"], 1978: ["Argentina"],
    1982: ["Spain"], 1986: ["Mexico"], 1990: ["Italy"],
    1994: ["United States"], 1998: ["France"],
    2002: ["Japan", "South Korea", "Korea Republic"],
    2006: ["Germany"], 2010: ["South Africa"], 2014: ["Brazil"],
    2018: ["Russia"], 2022: ["Qatar"],
}


def get_wc_year(date_str):
    return int(date_str[:4])


def is_host(team_name, year):
    hosts = WC_HOSTS.get(year, [])
    return any(h.lower() in team_name.lower() or team_name.lower() in h.lower()
               for h in hosts)


# ── Load data ────────────────────────────────────────────────────────────

def load_wc_matches(csv_path):
    matches = []
    with open(csv_path) as f:
        for row in csv.DictReader(f):
            if row["tournament_code"] != "WC":
                continue
            try:
                matches.append({
                    "date": row["date"],
                    "home": row["home_team_en"],
                    "away": row["away_team_en"],
                    "home_goals": int(row["home_goals"]),
                    "away_goals": int(row["away_goals"]),
                    "home_elo": float(row["home_elo_before"]),
                    "away_elo": float(row["away_elo_before"]),
                })
            except (ValueError, KeyError):
                continue
    return matches


# ── Prediction ───────────────────────────────────────────────────────────

def predict(home_elo, away_elo, divisor, draw_base):
    d = max(0.0, draw_base * (1.0 - abs(home_elo - away_elo) / 400.0))
    hw = (1.0 / (1.0 + 10.0 ** ((away_elo - home_elo) / divisor))) * (1 - d)
    aw = 1.0 - hw - d
    return (hw, d, aw)


def brier_score(preds, outs):
    total = sum((p - o) ** 2 for pred, out in zip(preds, outs)
                for p, o in zip(pred, out))
    return total / len(preds)


def log_loss(preds, outs):
    eps = 1e-10
    total = 0
    for pred, out in zip(preds, outs):
        for p, o in zip(pred, out):
            if o == 1:
                total -= math.log(max(p, eps))
    return total / len(preds)


def accuracy(preds, outs):
    return sum(1 for p, o in zip(preds, outs)
               if p.index(max(p)) == o.index(max(o))) / len(preds)


# ── Backtest ─────────────────────────────────────────────────────────────

def run_backtest(matches, divisor, draw_base, host_bonus):
    preds, outs = [], []
    for m in matches:
        year = get_wc_year(m["date"])
        h_elo = m["home_elo"] + (host_bonus if is_host(m["home"], year) else 0)
        a_elo = m["away_elo"] + (host_bonus if is_host(m["away"], year) else 0)

        pred = predict(h_elo, a_elo, divisor, draw_base)
        preds.append(pred)

        hs, as_ = m["home_goals"], m["away_goals"]
        out = (1, 0, 0) if hs > as_ else ((0, 1, 0) if hs == as_ else (0, 0, 1))
        outs.append(out)

    hw = sum(1 for o in outs if o[0] == 1)
    draws = sum(1 for o in outs if o[1] == 1)
    aw = sum(1 for o in outs if o[2] == 1)

    return {
        "brier_score": round(brier_score(preds, outs), 5),
        "log_loss": round(log_loss(preds, outs), 5),
        "accuracy": round(accuracy(preds, outs) * 100, 1),
        "total": len(matches),
        "home_wins": hw, "draws": draws, "away_wins": aw,
    }


# ── Grid search ──────────────────────────────────────────────────────────

def grid_search(matches, label=""):
    best_brier = 999
    best_params = None
    all_results = []

    divisors = list(range(300, 700, 15))
    draw_bases = [x / 100 for x in range(8, 36, 2)]
    host_bonuses = list(range(0, 130, 10))
    total = len(divisors) * len(draw_bases) * len(host_bonuses)
    print(f"  Grid: {total} combos ({len(divisors)} × {len(draw_bases)} × {len(host_bonuses)})")

    for div in divisors:
        for db in draw_bases:
            for hb in host_bonuses:
                r = run_backtest(matches, div, db, hb)
                entry = {"divisor": div, "draw_base": db, "host_bonus": hb, **r}
                all_results.append(entry)
                if r["brier_score"] < best_brier:
                    best_brier = r["brier_score"]
                    best_params = entry

    return best_params, sorted(all_results, key=lambda x: x["brier_score"])[:20]


# ── Main ─────────────────────────────────────────────────────────────────

def main():
    csv_path = "/Users/caerushu/Desktop/数据与投资/国家队历史比赛1872-2025 EN.csv"
    print("[backtest] Loading World Cup matches with real ELO ratings...")
    matches = load_wc_matches(csv_path)
    print(f"[backtest] {len(matches)} WC matches ({matches[0]['date']} to {matches[-1]['date']})")

    # Stats
    hw = sum(1 for m in matches if m["home_goals"] > m["away_goals"])
    dr = sum(1 for m in matches if m["home_goals"] == m["away_goals"])
    aw = len(matches) - hw - dr
    print(f"[backtest] Results: H:{hw} ({hw/len(matches)*100:.1f}%) D:{dr} ({dr/len(matches)*100:.1f}%) A:{aw} ({aw/len(matches)*100:.1f}%)")

    # Average ELO
    avg_elo = sum(m["home_elo"] + m["away_elo"] for m in matches) / (2 * len(matches))
    print(f"[backtest] Average ELO: {avg_elo:.0f}")

    # Current model
    print(f"\n{'='*60}")
    print("[backtest] CURRENT MODEL (divisor=515, draw=0.22, host=60):")
    current = run_backtest(matches, 515, 0.22, 60)
    print(f"  Brier: {current['brier_score']} | LogLoss: {current['log_loss']} | Acc: {current['accuracy']}%")

    # By era
    eras = {
        "all_time": matches,
        "modern_1998": [m for m in matches if m["date"] >= "1998-01-01"],
        "recent_2006": [m for m in matches if m["date"] >= "2006-01-01"],
    }

    results = {}
    for era_name, era_matches in eras.items():
        print(f"\n{'='*60}")
        print(f"[backtest] {era_name}: {len(era_matches)} matches")
        best, top20 = grid_search(era_matches, era_name)
        results[era_name] = {"best": best, "top20": top20}
        print(f"  BEST: div={best['divisor']} draw={best['draw_base']:.2f} host={best['host_bonus']}")
        print(f"  Brier: {best['brier_score']} | LogLoss: {best['log_loss']} | Acc: {best['accuracy']}%")

    # Save
    output = {
        "generated_at": datetime.now().isoformat(),
        "data_source": "eloratings.net historical dataset (51,246 intl matches, 1872-2025)",
        "wc_matches": len(matches),
        "date_range": f"{matches[0]['date']} to {matches[-1]['date']}",
        "current_model": {"divisor": 515, "draw_base": 0.22, "host_bonus": 60, **current},
        "optimized_by_era": results,
    }

    out_path = os.path.join(os.path.dirname(__file__), "backtest_results.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n[backtest] Saved to {out_path}")

    # Final recommendation
    rec = results["modern_1998"]["best"]
    print(f"\n{'='*60}")
    print(f"[RECOMMENDATION] For 2026 WC predictions:")
    print(f"  divisor={rec['divisor']}, draw_base={rec['draw_base']}, host_bonus={rec['host_bonus']}")
    print(f"  Brier: {rec['brier_score']} (vs current {current['brier_score']})")
    print(f"  Improvement: {((current['brier_score'] - rec['brier_score']) / current['brier_score'] * 100):.2f}%")


if __name__ == "__main__":
    main()
