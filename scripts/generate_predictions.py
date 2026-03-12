#!/usr/bin/env python3

import json
import random
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ELO_PATH = ROOT / "public" / "data" / "elo.json"
PREDICTIONS_PATH = ROOT / "public" / "data" / "predictions.json"
SIMULATION_COUNT = 10_000
RANDOM_SEED = 20260313


def read_elo_snapshot():
    with ELO_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def compute_weight(elo, baseline):
    return 10 ** ((float(elo) - baseline) / 400)


def build_predictions(snapshot):
    rankings = list(snapshot.get("rankings") or [])
    if not rankings:
        return {
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "simulationCount": SIMULATION_COUNT,
            "method": "暂无可用 Elo 数据，无法生成夺冠概率预计算。",
            "teams": [],
        }

    random.seed(RANDOM_SEED)

    baseline = max(1600, min(float(team.get("elo") or 0) for team in rankings if team.get("elo")))
    weighted = []
    for team in rankings:
      weight = compute_weight(team.get("elo") or 0, baseline)
      weighted.append({
          **team,
          "weight": weight,
      })

    choices = [team["name"] for team in weighted]
    choice_weights = [team["weight"] for team in weighted]
    winners = random.choices(choices, weights=choice_weights, k=SIMULATION_COUNT)
    winner_counts = Counter(winners)

    probabilities = []
    for team in weighted:
        wins = winner_counts.get(team["name"], 0)
        probability_value = round((wins / SIMULATION_COUNT) * 100, 2)
        probabilities.append({
            "flag": team["flag"],
            "name": team["name"],
            "elo": team["elo"],
            "wins": wins,
            "probabilityValue": probability_value,
        })

    probabilities.sort(key=lambda item: (-item["probabilityValue"], -item["elo"], item["name"]))
    max_probability = max((team["probabilityValue"] for team in probabilities), default=1)

    teams = []
    for index, team in enumerate(probabilities, start=1):
        teams.append({
            "rank": index,
            "flag": team["flag"],
            "name": team["name"],
            "elo": team["elo"],
            "titleProbability": f"{team['probabilityValue']:.1f}%",
            "probabilityValue": team["probabilityValue"],
            "width": max(6, round((team["probabilityValue"] / max_probability) * 100)) if max_probability else 6,
            "wins": team["wins"],
        })

    updated_at = snapshot.get("updatedAt") or datetime.now(timezone.utc).isoformat()
    return {
        "updatedAt": updated_at,
        "simulationCount": SIMULATION_COUNT,
        "method": "基于当前 Elo 快照，按 Elo 差值换算相对强度后进行 10000 次蒙特卡洛冠军抽样预计算，并导出为静态 JSON；当前为先验概率版，后续可替换为完整 48 队赛程路径模拟。",
        "teams": teams,
    }


def write_predictions(predictions):
    PREDICTIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with PREDICTIONS_PATH.open("w", encoding="utf-8") as file:
        json.dump(predictions, file, ensure_ascii=False, indent=2)
        file.write("\n")


def main():
    snapshot = read_elo_snapshot()
    predictions = build_predictions(snapshot)
    write_predictions(predictions)


if __name__ == "__main__":
    main()
