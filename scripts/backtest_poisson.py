#!/usr/bin/env python3
"""
Backtest Poisson + Dixon-Coles match prediction model against 964 World Cup matches (1930-2022).

Uses real pre-match ELO ratings from eloratings.net historical dataset.
Grid searches over (elo_divisor, rho, avg_goals, goal_share_factor, host_boost)
to minimize Brier Score.

Model: ELO -> lambda via goal-share mapping -> Poisson score matrix -> Dixon-Coles correction.

Output: scripts/backtest_poisson_results.json
"""

import csv
import json
import math
import os
import sys
import time
from datetime import datetime
from multiprocessing import Pool, cpu_count
from itertools import product

import numpy as np

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

MAX_GOALS = 6


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


# ── Vectorized Poisson model ─────────────────────────────────────────────

# Precompute log-factorials for 0..MAX_GOALS
_LOG_FACT = np.zeros(MAX_GOALS + 1)
for _i in range(2, MAX_GOALS + 1):
    _LOG_FACT[_i] = _LOG_FACT[_i - 1] + math.log(_i)


def poisson_pmf_array(max_k, lam):
    """Return np array of Poisson PMF for k=0..max_k."""
    if lam <= 0:
        out = np.zeros(max_k + 1)
        out[0] = 1.0
        return out
    ks = np.arange(max_k + 1, dtype=np.float64)
    log_p = -lam + ks * math.log(lam) - _LOG_FACT[:max_k + 1]
    return np.exp(log_p)


def build_score_matrix(lam_home, lam_away, rho):
    """Build (MAX_GOALS+1) x (MAX_GOALS+1) score probability matrix."""
    ph = poisson_pmf_array(MAX_GOALS, lam_home)
    pa = poisson_pmf_array(MAX_GOALS, lam_away)
    matrix = np.outer(ph, pa)

    # Dixon-Coles correction
    if rho != 0 and lam_home > 0 and lam_away > 0:
        matrix[0, 0] *= 1 - lam_home * lam_away * rho
        matrix[1, 0] *= 1 + lam_away * rho
        matrix[0, 1] *= 1 + lam_home * rho
        matrix[1, 1] *= 1 - rho

    # Clamp negatives and normalize
    np.clip(matrix, 0, None, out=matrix)
    total = matrix.sum()
    if total > 0 and abs(total - 1) > 0.001:
        matrix /= total

    return matrix


def derive_1x2(matrix):
    """Return (p_home_win, p_draw, p_away_win) from score matrix."""
    n = matrix.shape[0]
    home_win = 0.0
    draw = 0.0
    away_win = 0.0
    for x in range(n):
        for y in range(n):
            if x > y:
                home_win += matrix[x, y]
            elif x == y:
                draw += matrix[x, y]
            else:
                away_win += matrix[x, y]
    return home_win, draw, away_win


def most_likely_score(matrix):
    """Return (home_goals, away_goals) of the most probable score."""
    idx = np.argmax(matrix)
    n = matrix.shape[1]
    return divmod(idx, n)


# ── Prediction for one match ─────────────────────────────────────────────

def predict_match(home_elo, away_elo, elo_divisor, avg_goals, goal_share_factor,
                  rho, host_boost_home, host_boost_away):
    """
    Return (p_home, p_draw, p_away, predicted_home_goals, predicted_away_goals).
    """
    diff = home_elo - away_elo
    home_exp_win = 1.0 / (1.0 + 10.0 ** (-diff / elo_divisor))
    home_goal_share = 0.5 + (home_exp_win - 0.5) * goal_share_factor

    lam_home = avg_goals * home_goal_share * host_boost_home
    lam_away = avg_goals * (1 - home_goal_share) * host_boost_away

    # Clamp
    lam_home = max(0.3, min(3.5, lam_home))
    lam_away = max(0.3, min(3.5, lam_away))

    matrix = build_score_matrix(lam_home, lam_away, rho)
    p_home, p_draw, p_away = derive_1x2(matrix)
    pred_h, pred_a = most_likely_score(matrix)

    return p_home, p_draw, p_away, pred_h, pred_a


# ── Metrics ──────────────────────────────────────────────────────────────

def brier_score(preds, actuals):
    """Brier score for 3-outcome predictions."""
    total = 0.0
    for (ph, pd, pa), (ah, ad, aa) in zip(preds, actuals):
        total += (ph - ah) ** 2 + (pd - ad) ** 2 + (pa - aa) ** 2
    return total / len(preds)


def log_loss_metric(preds, actuals):
    """Log loss: -log(prob assigned to actual outcome)."""
    eps = 1e-10
    total = 0.0
    for (ph, pd, pa), (ah, ad, aa) in zip(preds, actuals):
        if ah == 1:
            total -= math.log(max(ph, eps))
        elif ad == 1:
            total -= math.log(max(pd, eps))
        else:
            total -= math.log(max(pa, eps))
    return total / len(preds)


def accuracy_metric(preds, actuals):
    """% of matches where the highest predicted prob matches actual outcome."""
    correct = 0
    for pred, actual in zip(preds, actuals):
        pred_idx = max(range(3), key=lambda i: pred[i])
        actual_idx = max(range(3), key=lambda i: actual[i])
        if pred_idx == actual_idx:
            correct += 1
    return correct / len(preds) * 100


def calibration_buckets(preds, actuals):
    """Group predictions into 10% buckets, check predicted vs actual frequency."""
    # Collect all individual probabilities with their outcomes
    pairs = []
    for (ph, pd, pa), (ah, ad, aa) in zip(preds, actuals):
        pairs.append((ph, ah))
        pairs.append((pd, ad))
        pairs.append((pa, aa))

    buckets = []
    for lo in range(0, 100, 10):
        hi = lo + 10
        in_bucket = [(p, o) for p, o in pairs if lo / 100 <= p < hi / 100]
        if not in_bucket:
            buckets.append({
                "bucket": f"{lo}-{hi}%",
                "predicted_avg": None,
                "actual_avg": None,
                "count": 0,
            })
        else:
            pred_avg = sum(p for p, o in in_bucket) / len(in_bucket)
            actual_avg = sum(o for p, o in in_bucket) / len(in_bucket)
            buckets.append({
                "bucket": f"{lo}-{hi}%",
                "predicted_avg": round(pred_avg, 4),
                "actual_avg": round(actual_avg, 4),
                "count": len(in_bucket),
            })
    return buckets


# ── Single backtest run ──────────────────────────────────────────────────

def run_backtest(matches, elo_divisor, rho, avg_goals, goal_share_factor, host_boost):
    """Run full backtest with given parameters. Returns dict of metrics."""
    preds_1x2 = []
    actuals = []
    score_correct = 0

    opponent_penalty = 1.0 - (host_boost - 1.0) * 0.33

    for m in matches:
        year = get_wc_year(m["date"])
        home_is_host = is_host(m["home"], year)
        away_is_host = is_host(m["away"], year)

        hb_home = 1.0
        hb_away = 1.0
        if home_is_host:
            hb_home = host_boost
            hb_away = opponent_penalty
        elif away_is_host:
            hb_away = host_boost
            hb_home = opponent_penalty

        ph, pd, pa, pred_h, pred_a = predict_match(
            m["home_elo"], m["away_elo"],
            elo_divisor, avg_goals, goal_share_factor, rho,
            hb_home, hb_away,
        )
        preds_1x2.append((ph, pd, pa))

        hg, ag = m["home_goals"], m["away_goals"]
        if hg > ag:
            actuals.append((1, 0, 0))
        elif hg == ag:
            actuals.append((0, 1, 0))
        else:
            actuals.append((0, 0, 1))

        if pred_h == hg and pred_a == ag:
            score_correct += 1

    bs = brier_score(preds_1x2, actuals)
    ll = log_loss_metric(preds_1x2, actuals)
    acc = accuracy_metric(preds_1x2, actuals)
    score_acc = score_correct / len(matches) * 100

    return {
        "brier_score": round(bs, 5),
        "log_loss": round(ll, 5),
        "accuracy": round(acc, 1),
        "score_accuracy": round(score_acc, 1),
    }


# ── Worker for multiprocessing ───────────────────────────────────────────

# Global reference set by initializer
_worker_matches = None


def _init_worker(matches):
    global _worker_matches
    _worker_matches = matches


def _eval_params(params):
    elo_divisor, rho, avg_goals, goal_share_factor, host_boost = params
    result = run_backtest(_worker_matches, elo_divisor, rho, avg_goals,
                          goal_share_factor, host_boost)
    return {
        "params": {
            "elo_divisor": elo_divisor,
            "rho": round(rho, 2),
            "avg_goals": round(avg_goals, 1),
            "goal_share_factor": round(goal_share_factor, 2),
            "host_boost": round(host_boost, 2),
        },
        **result,
    }


# ── Grid search ──────────────────────────────────────────────────────────

def grid_search(matches):
    elo_divisors = list(range(300, 601, 25))       # 13 values
    rhos = [x / 100 for x in range(-15, 6, 1)]      # 21 values
    avg_goals_vals = [x / 10 for x in range(22, 31, 1)]  # 9 values
    goal_share_factors = [x / 100 for x in range(40, 81, 5)]  # 9 values
    host_boosts = [1.0 + x * 0.03 for x in range(0, 9)]  # 9 values: 1.0 to 1.24

    combos = list(product(elo_divisors, rhos, avg_goals_vals,
                          goal_share_factors, host_boosts))
    total = len(combos)
    print(f"  Grid: {total:,} combos "
          f"({len(elo_divisors)} x {len(rhos)} x {len(avg_goals_vals)} "
          f"x {len(goal_share_factors)} x {len(host_boosts)})")

    ncpu = max(1, cpu_count() - 1)
    print(f"  Using {ncpu} worker processes")

    best_brier = 999.0
    best_result = None
    all_results = []
    done = 0
    t0 = time.time()

    # Process in chunks to show progress
    chunk_size = 5000

    with Pool(ncpu, initializer=_init_worker, initargs=(matches,)) as pool:
        for i in range(0, total, chunk_size):
            chunk = combos[i:i + chunk_size]
            results = pool.map(_eval_params, chunk, chunksize=200)
            for r in results:
                if r["brier_score"] < best_brier:
                    best_brier = r["brier_score"]
                    best_result = r
            all_results.extend(results)
            done += len(chunk)
            elapsed = time.time() - t0
            rate = done / elapsed if elapsed > 0 else 0
            eta = (total - done) / rate if rate > 0 else 0
            print(f"  Progress: {done:,}/{total:,} ({done/total*100:.1f}%) "
                  f"| Best Brier: {best_brier:.5f} "
                  f"| {rate:.0f} combos/s | ETA: {eta:.0f}s", end="\r")

    print()  # newline after progress
    elapsed = time.time() - t0
    print(f"  Completed in {elapsed:.1f}s ({total / elapsed:.0f} combos/s)")

    all_results.sort(key=lambda x: x["brier_score"])
    return best_result, all_results[:20]


# ── ELO-only baseline ───────────────────────────────────────────────────

def elo_baseline(matches):
    """Simple ELO-based 1X2 prediction (same as backtest_elo.py current model)."""
    divisor = 515
    draw_base = 0.22
    host_bonus = 60

    preds, actuals = [], []
    for m in matches:
        year = get_wc_year(m["date"])
        h_elo = m["home_elo"] + (host_bonus if is_host(m["home"], year) else 0)
        a_elo = m["away_elo"] + (host_bonus if is_host(m["away"], year) else 0)

        d = max(0.0, draw_base * (1.0 - abs(h_elo - a_elo) / 400.0))
        hw = (1.0 / (1.0 + 10.0 ** ((a_elo - h_elo) / divisor))) * (1 - d)
        aw = 1.0 - hw - d
        preds.append((hw, d, aw))

        hg, ag = m["home_goals"], m["away_goals"]
        if hg > ag:
            actuals.append((1, 0, 0))
        elif hg == ag:
            actuals.append((0, 1, 0))
        else:
            actuals.append((0, 0, 1))

    return {
        "brier_score": round(brier_score(preds, actuals), 5),
        "log_loss": round(log_loss_metric(preds, actuals), 5),
        "accuracy": round(accuracy_metric(preds, actuals), 1),
    }


# ── Main ─────────────────────────────────────────────────────────────────

def main():
    csv_path = "/Users/caerushu/Desktop/数据与投资/国家队历史比赛1872-2025 EN.csv"
    print("[poisson-backtest] Loading World Cup matches...")
    matches = load_wc_matches(csv_path)
    print(f"[poisson-backtest] {len(matches)} WC matches "
          f"({matches[0]['date']} to {matches[-1]['date']})")

    # Stats
    hw = sum(1 for m in matches if m["home_goals"] > m["away_goals"])
    dr = sum(1 for m in matches if m["home_goals"] == m["away_goals"])
    aw = len(matches) - hw - dr
    avg_total_goals = sum(m["home_goals"] + m["away_goals"] for m in matches) / len(matches)
    print(f"[poisson-backtest] Results: H:{hw} D:{dr} A:{aw} | "
          f"Avg goals/match: {avg_total_goals:.2f}")

    # ELO-only baseline
    print(f"\n{'='*70}")
    print("[poisson-backtest] ELO-only baseline (div=515, draw=0.22, host=60):")
    baseline = elo_baseline(matches)
    print(f"  Brier: {baseline['brier_score']} | "
          f"LogLoss: {baseline['log_loss']} | Acc: {baseline['accuracy']}%")

    # Grid search
    print(f"\n{'='*70}")
    print("[poisson-backtest] Grid search for optimal Poisson+DC parameters...")
    best, top20 = grid_search(matches)

    print(f"\n{'='*70}")
    print("[poisson-backtest] BEST PARAMETERS:")
    for k, v in best["params"].items():
        print(f"  {k}: {v}")
    print(f"  Brier: {best['brier_score']} | LogLoss: {best['log_loss']} | "
          f"Acc: {best['accuracy']}% | Score Acc: {best['score_accuracy']}%")

    # Compute calibration for the best params
    print("\n[poisson-backtest] Computing calibration for best params...")
    p = best["params"]
    opponent_penalty = 1.0 - (p["host_boost"] - 1.0) * 0.33
    preds_1x2 = []
    actuals = []
    for m in matches:
        year = get_wc_year(m["date"])
        hb_h, hb_a = 1.0, 1.0
        if is_host(m["home"], year):
            hb_h = p["host_boost"]
            hb_a = opponent_penalty
        elif is_host(m["away"], year):
            hb_a = p["host_boost"]
            hb_h = opponent_penalty

        ph, pd, pa, _, _ = predict_match(
            m["home_elo"], m["away_elo"],
            p["elo_divisor"], p["avg_goals"], p["goal_share_factor"],
            p["rho"], hb_h, hb_a,
        )
        preds_1x2.append((ph, pd, pa))
        hg, ag = m["home_goals"], m["away_goals"]
        if hg > ag:
            actuals.append((1, 0, 0))
        elif hg == ag:
            actuals.append((0, 1, 0))
        else:
            actuals.append((0, 0, 1))

    cal = calibration_buckets(preds_1x2, actuals)
    print("  Calibration:")
    for b in cal:
        if b["count"] > 0:
            print(f"    {b['bucket']}: pred={b['predicted_avg']:.3f} "
                  f"actual={b['actual_avg']:.3f} (n={b['count']})")

    # Improvement over baseline
    improvement = (baseline["brier_score"] - best["brier_score"]) / baseline["brier_score"] * 100
    print(f"\n[poisson-backtest] Improvement over ELO baseline: {improvement:.2f}%")

    # Save results
    output = {
        "generated_at": datetime.now().isoformat(),
        "wc_matches": len(matches),
        "baseline_elo": baseline,
        "optimized": {
            "params": best["params"],
            "brier_score": best["brier_score"],
            "log_loss": best["log_loss"],
            "accuracy": best["accuracy"],
            "score_accuracy": best["score_accuracy"],
            "calibration": cal,
        },
        "top_20": top20,
    }

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "backtest_poisson_results.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n[poisson-backtest] Saved to {out_path}")

    # Print top 5 for quick review
    print(f"\n{'='*70}")
    print("[poisson-backtest] TOP 5 parameter combos:")
    for i, r in enumerate(top20[:5], 1):
        p = r["params"]
        print(f"  #{i}: div={p['elo_divisor']} rho={p['rho']} avg={p['avg_goals']} "
              f"gsf={p['goal_share_factor']} host={p['host_boost']} "
              f"-> Brier={r['brier_score']} Acc={r['accuracy']}%")


if __name__ == "__main__":
    main()
