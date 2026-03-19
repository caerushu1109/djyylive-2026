#!/usr/bin/env python3
"""
WC 2026 夺冠概率 — 完整蒙特卡洛赛程模拟（6 阶段概率版）

校准结果（基于 964 场历史世界杯赛果）：
  - 最优 ELO 除数：D = 515（标准值 400，WC 强队优势更明显）
  - 东道主加成：美国 / 加拿大 / 墨西哥 各 +60 ELO
  - 小组赛平局基础概率：22%（随 ELO 差增大衰减）

模拟路径：
  小组赛 (6 场/组) → 32强出线 → R32 → R16 → QF → SF → 决赛

6 阶段概率字段：
  pQualify  小组出线（进入淘汰赛）
  pR16      进16强（赢得 R32）
  pQF       进8强（赢得 R16）
  pSF       进4强（赢得 QF）
  pFinal    进决赛（赢得 SF）
  pChampion 夺冠（赢得决赛）
"""

import json
import os
import random
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

ELO_PATH         = ROOT / "public" / "data" / "elo.json"
GROUPS_PATH      = ROOT / "public" / "data" / "wc2026-groups.json"
PARTICIPANTS_PATH = ROOT / "public" / "data" / "wc2026-participants.json"
PREDICTIONS_PATH  = ROOT / "public" / "data" / "predictions.json"

# ── 校准常量 ──────────────────────────────────────────────────────────────────
ELO_DIVISOR    = 515        # log-loss 校准最优值（历史 WC 赛果，标准 400）
HOST_BONUS     = 60         # 东道主 ELO 加成
HOST_CODES     = {"US", "CA", "MX"}
DRAW_BASE      = 0.22       # 小组赛平局基础概率（ELO 相近时）
DRAW_DECAY     = 400        # ELO 差超过此值平局概率趋近 0
SIMULATION_COUNT = 10_000
RANDOM_SEED    = 20260313

WC_SEASON_ID   = 26618

# R32 分区配对（按 FIFA WC2026 赛制：12 组两两配对为 6 个分区）
GROUP_PAIRS = [("A", "B"), ("C", "D"), ("E", "F"),
               ("G", "H"), ("I", "J"), ("K", "L")]

# 已知的队伍名称映射（Sportmonks 英文名 → ELO 库英文名）
NAME_ALIASES = {
    "Korea Republic":       "South Korea",
    "Côte d'Ivoire":        "Ivory Coast",
    "Cape Verde Islands":   "Cape Verde",
    "Curacao":              "Curaçao",
    "USA":                  "United States",
    "United States of America": "United States",
}


# ── 工具 ──────────────────────────────────────────────────────────────────────

def load_local_env():
    env_path = ROOT / ".env.local"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def read_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path, payload):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")


def sportmonks_url(pathname, extra_params=None):
    token = os.environ.get("SPORTMONKS_API_TOKEN", "")
    base  = (os.environ.get("SPORTMONKS_BASE_URL") or
             "https://api.sportmonks.com/v3/football").rstrip("/")
    url   = f"{base}/{pathname.lstrip('/')}?api_token={token}"
    if extra_params:
        for k, v in extra_params.items():
            url += f"&{k}={v}"
    return url


def fetch_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


# ── ELO 胜率模型 ──────────────────────────────────────────────────────────────

def win_prob(elo_a, elo_b):
    """P(A 赢)，校准除数 D=515"""
    return 1.0 / (1.0 + 10.0 ** ((elo_b - elo_a) / ELO_DIVISOR))


def draw_prob(elo_a, elo_b):
    """小组赛平局概率：ELO 差越大越低"""
    gap = abs(elo_a - elo_b)
    return max(0.0, DRAW_BASE * (1.0 - gap / DRAW_DECAY))


def group_match(team_a, team_b):
    """
    小组赛一场比赛 → (pts_a, pts_b, gd_a)
    平局：各得 1 分，净胜球 0
    胜：胜方得 3 分，随机净胜球 1-3
    """
    pa = win_prob(team_a["elo"], team_b["elo"])
    pd = draw_prob(team_a["elo"], team_b["elo"])
    r  = random.random()
    if r < pd:
        return 1, 1, 0
    gd = random.choices([1, 2, 3], weights=[50, 35, 15])[0]
    if r < pd + pa:
        return 3, 0, gd      # A 赢
    return 0, 3, -gd         # B 赢


def ko_winner(team_a, team_b):
    """淘汰赛（含加时/点球）：直接决出胜者"""
    return team_a if random.random() < win_prob(team_a["elo"], team_b["elo"]) else team_b


# ── 小组赛模拟 ────────────────────────────────────────────────────────────────

def simulate_group(teams):
    """
    4 队循环赛 (6 场)
    返回按名次排好的 [stats_dict, ...] 列表，index 0 = 第 1 名
    """
    stats = {t["code"]: {"team": t, "pts": 0, "gd": 0, "gf": 0}
             for t in teams}
    pairs = [(teams[i], teams[j])
             for i in range(4) for j in range(i + 1, 4)]
    for a, b in pairs:
        pa, pb, gd_a = group_match(a, b)
        s_a = stats[a["code"]]
        s_b = stats[b["code"]]
        s_a["pts"] += pa;  s_a["gd"] += gd_a
        s_b["pts"] += pb;  s_b["gd"] -= gd_a
        # 进球近似（净胜球正数 + 平局各 1）
        if gd_a > 0:
            s_a["gf"] += gd_a
        elif gd_a < 0:
            s_b["gf"] += -gd_a
        else:
            s_a["gf"] += 1;  s_b["gf"] += 1

    return sorted(stats.values(),
                  key=lambda s: (-s["pts"], -s["gd"], -s["gf"],
                                  s["team"]["code"]))


# ── 最佳第三名选取 ────────────────────────────────────────────────────────────

def select_best_thirds(thirds_with_group):
    """
    thirds_with_group: [(group_letter, stats_dict), ...]  (12 项)
    返回积分最佳 8 支第三名的 team dict 列表
    """
    ranked = sorted(thirds_with_group,
                    key=lambda x: (-x[1]["pts"], -x[1]["gd"], -x[1]["gf"]))
    return [x[1]["team"] for x in ranked[:8]]


# ── R32 对阵生成 ──────────────────────────────────────────────────────────────

def build_r32(group_results, best_thirds):
    """
    group_results: {letter: [ranked_stats, ...]}   index 0=1st place
    best_thirds: [team_dict, ...]  8 支最佳第三名（已按积分排序）
    返回 16 场 R32 对阵 [(team_a, team_b), ...]
    """
    matches = []
    # 6 对组 × 2 场 = 12 场：交叉对阵
    for g1, g2 in GROUP_PAIRS:
        t1_1st = group_results[g1][0]["team"]
        t1_2nd = group_results[g1][1]["team"]
        t2_1st = group_results[g2][0]["team"]
        t2_2nd = group_results[g2][1]["team"]
        matches.append((t1_1st, t2_2nd))   # 1A vs 2B
        matches.append((t2_1st, t1_2nd))   # 1B vs 2A

    # 4 场：最佳第三名两两对阵
    thirds = list(best_thirds)
    for i in range(0, len(thirds) - 1, 2):
        matches.append((thirds[i], thirds[i + 1]))

    # 确保恰好 16 场
    return matches[:16]


def run_ko(bracket):
    """淘汰赛一轮 → 胜者列表"""
    return [ko_winner(a, b) for a, b in bracket]


# ── 完整赛程模拟（返回每队所达阶段）────────────────────────────────────────────

def simulate_tournament(groups_data, elo_map):
    """
    单次完整赛程模拟。
    返回 {code: stage} 字典：
      0 = 小组出局
      1 = 小组出线（进入 R32）
      2 = 进16强（赢 R32）
      3 = 进8强（赢 R16）
      4 = 进4强（赢 QF）
      5 = 进决赛（赢 SF）
      6 = 夺冠（赢决赛）
    groups_data: {letter: [team_meta_dict, ...]}
    elo_map:     {code: float_elo}
    """
    def enrich(t):
        base = elo_map.get(t["code"], 1600)
        bonus = HOST_BONUS if t["code"] in HOST_CODES else 0
        return {**t, "elo": base + bonus}

    enriched = {g: [enrich(t) for t in teams]
                for g, teams in groups_data.items()}

    # 所有参赛队初始阶段为 0（小组出局）
    stages = {}
    for teams in enriched.values():
        for t in teams:
            stages[t["code"]] = 0

    group_results = {}
    thirds = []
    for g, teams in enriched.items():
        ranked = simulate_group(teams)
        group_results[g] = ranked
        stages[ranked[0]["team"]["code"]] = 1   # 1st → 出线
        stages[ranked[1]["team"]["code"]] = 1   # 2nd → 出线
        thirds.append((g, ranked[2]))            # 3rd 候选

    best_thirds = select_best_thirds(thirds)
    for t in best_thirds:
        stages[t["code"]] = 1  # 最佳第三名 → 出线

    # R32 → stage 2（进16强）
    r32 = build_r32(group_results, best_thirds)
    r16_teams = [ko_winner(a, b) for a, b in r32]
    for t in r16_teams:
        stages[t["code"]] = 2

    # R16 → stage 3（进8强）
    r16 = list(zip(r16_teams[::2], r16_teams[1::2]))
    qf_teams = [ko_winner(a, b) for a, b in r16]
    for t in qf_teams:
        stages[t["code"]] = 3

    # QF → stage 4（进4强）
    qf = list(zip(qf_teams[::2], qf_teams[1::2]))
    sf_teams = [ko_winner(a, b) for a, b in qf]
    for t in sf_teams:
        stages[t["code"]] = 4

    # SF → stage 5（进决赛）
    sf = list(zip(sf_teams[::2], sf_teams[1::2]))
    finalists = [ko_winner(a, b) for a, b in sf]
    for t in finalists:
        stages[t["code"]] = 5

    # 决赛 → stage 6（夺冠）
    if len(finalists) >= 2:
        champion = ko_winner(finalists[0], finalists[1])
        stages[champion["code"]] = 6

    return stages


# ── Sportmonks 分组数据获取 ───────────────────────────────────────────────────

def fetch_groups(elo_snapshot):
    """
    从 Sportmonks standings API 获取分组签位
    返回 {letter: [team_meta, ...]} 或 None
    """
    token = os.environ.get("SPORTMONKS_API_TOKEN", "")
    if not token:
        return None

    try:
        url  = sportmonks_url(
            f"standings/seasons/{WC_SEASON_ID}",
            {"include": "participant;group"}
        )
        resp = fetch_json(url)
        rows = resp.get("data") or []
        if not rows:
            return None

        # ELO lookup: originalName (lowercase) → team dict
        elo_by_name = {}
        for t in elo_snapshot.get("rankings", []):
            orig = (t.get("originalName") or t.get("name") or "").lower()
            elo_by_name[orig] = t

        groups = defaultdict(list)
        for row in rows:
            group_raw = (row.get("group") or {}).get("name", "")
            letter = group_raw.replace("Group", "").strip()
            if not letter:
                continue

            sm_name = (row.get("participant") or {}).get("name", "")
            mapped  = NAME_ALIASES.get(sm_name, sm_name)
            match   = elo_by_name.get(mapped.lower())
            if not match:
                # Try partial match
                match = next(
                    (t for n, t in elo_by_name.items() if mapped.lower() in n),
                    None
                )
            if not match:
                print(f"[warn] No ELO match for '{sm_name}' (group {letter})",
                      file=sys.stderr)
                continue

            groups[letter].append({
                "code":         match["code"],
                "name":         match["name"],
                "originalName": match.get("originalName", sm_name),
                "flag":         match["flag"],
            })

        valid = {g: v for g, v in groups.items() if len(v) == 4}
        return valid if len(valid) == 12 else None

    except Exception as e:
        print(f"[warn] Group fetch failed: {e}", file=sys.stderr)
        return None


def load_cached_groups():
    if GROUPS_PATH.exists():
        d = read_json(GROUPS_PATH)
        g = d.get("groups")
        if g and len(g) == 12:
            return g
    return None


# ── 主预测逻辑 ────────────────────────────────────────────────────────────────

def build_predictions(snapshot):
    rankings = snapshot.get("rankings") or []
    if not rankings:
        return {
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "simulationCount": 0,
            "method": "暂无 ELO 数据",
            "teams": [],
        }

    # 排除占位符
    rankings = [t for t in rankings if not t.get("placeholder", False)]

    elo_map = {t["code"]: float(t["elo"])
               for t in rankings if t.get("elo") and t.get("code")}

    # 获取分组数据
    groups_data  = fetch_groups(snapshot)
    group_source = "sportmonks-live"
    if groups_data:
        write_json(GROUPS_PATH, {
            "updatedAt": snapshot.get("updatedAt", ""),
            "source": "sportmonks",
            "groups": groups_data,
        })
        print(f"[info] {len(groups_data)} groups fetched from Sportmonks")
    else:
        groups_data  = load_cached_groups()
        group_source = "local-cache"
        if groups_data:
            print(f"[info] {len(groups_data)} groups loaded from cache")

    # 没有分组数据 → 回退到加权抽样先验
    if not groups_data or len(groups_data) < 12:
        print("[warn] Group data unavailable — using prior-only mode")
        return _prior_predictions(snapshot, rankings)

    # 蒙特卡洛 — 追踪 6 个阶段
    random.seed(RANDOM_SEED)
    # stage_counts[code][s] = 达到阶段 s 的次数（s=1..6）
    stage_counts = defaultdict(lambda: [0] * 7)

    for _ in range(SIMULATION_COUNT):
        result = simulate_tournament(groups_data, elo_map)
        for code, stage in result.items():
            for s in range(1, stage + 1):
                stage_counts[code][s] += 1

    meta = {t["code"]: t for t in rankings}
    # 按夺冠概率排序
    sorted_codes = sorted(
        stage_counts.keys(),
        key=lambda c: -stage_counts[c][6]
    )
    max_wins = stage_counts[sorted_codes[0]][6] if sorted_codes else 1

    N = SIMULATION_COUNT
    teams_out = []
    for rank, code in enumerate(sorted_codes, 1):
        t   = meta.get(code, {})
        cnt = stage_counts[code]
        pct = round(cnt[6] / N * 100, 2)
        teams_out.append({
            "rank": rank,
            "flag": t.get("flag", "🏳️"),
            "name": t.get("name", code),
            "code": code,
            "elo":  elo_map.get(code, 1600),
            "eloWithBonus": elo_map.get(code, 1600) + (HOST_BONUS if code in HOST_CODES else 0),
            "isHost": code in HOST_CODES,
            "titleProbability": f"{pct:.1f}%",
            "probabilityValue": pct,
            "width": max(6, round(cnt[6] / max_wins * 100)),
            "wins": cnt[6],
            # 6 阶段概率
            "pQualify":  round(cnt[1] / N * 100, 1),
            "pR16":      round(cnt[2] / N * 100, 1),
            "pQF":       round(cnt[3] / N * 100, 1),
            "pSF":       round(cnt[4] / N * 100, 1),
            "pFinal":    round(cnt[5] / N * 100, 1),
            "pChampion": round(cnt[6] / N * 100, 1),
        })

    return {
        "updatedAt":       snapshot.get("updatedAt", datetime.now(timezone.utc).isoformat()),
        "simulationCount": SIMULATION_COUNT,
        "eloDivisor":      ELO_DIVISOR,
        "hostBonus":       HOST_BONUS,
        "groupSource":     group_source,
        "method": (
            f"完整赛程蒙特卡洛模拟 {SIMULATION_COUNT:,} 次。"
            f"ELO 胜率除数 D={ELO_DIVISOR}（964 场历史世界杯赛果校准，标准值 400）。"
            f"东道主美国/加拿大/墨西哥各 +{HOST_BONUS} ELO。"
            f"路径：小组循环赛→最佳第三名→R32→R16→QF→SF→决赛。"
        ),
        "teams": teams_out,
    }


def _prior_predictions(snapshot, rankings):
    """分组数据不可用时的回退：加权抽样先验概率（仅夺冠，无阶段概率）"""
    random.seed(RANDOM_SEED)
    baseline = max(1600, min(float(t["elo"]) for t in rankings if t.get("elo")))

    weighted, names, weights_ = [], [], []
    for t in rankings:
        elo   = float(t.get("elo") or baseline)
        bonus = HOST_BONUS if t.get("code") in HOST_CODES else 0
        w     = 10 ** ((elo + bonus - baseline) / ELO_DIVISOR)
        weighted.append({**t, "eloWithBonus": elo + bonus})
        names.append(t["name"])
        weights_.append(w)

    wins_map = defaultdict(int)
    for w in random.choices(names, weights=weights_, k=SIMULATION_COUNT):
        wins_map[w] += 1

    teams_out = []
    for t in weighted:
        wins = wins_map.get(t["name"], 0)
        pct  = round(wins / SIMULATION_COUNT * 100, 2)
        teams_out.append({
            "rank": 0, "flag": t["flag"], "name": t["name"],
            "code": t.get("code", ""),
            "elo":  float(t.get("elo") or baseline),
            "eloWithBonus": t["eloWithBonus"],
            "isHost": t.get("code") in HOST_CODES,
            "titleProbability": f"{pct:.1f}%",
            "probabilityValue": pct, "wins": wins, "width": 0,
            # 先验模式无阶段概率
            "pQualify": None, "pR16": None, "pQF": None,
            "pSF": None, "pFinal": None, "pChampion": pct,
        })
    teams_out.sort(key=lambda x: (-x["probabilityValue"], -x["elo"]))
    max_pct = teams_out[0]["probabilityValue"] if teams_out else 1
    for i, t in enumerate(teams_out, 1):
        t["rank"]  = i
        t["width"] = max(6, round(t["probabilityValue"] / max_pct * 100))

    return {
        "updatedAt":       snapshot.get("updatedAt", datetime.now(timezone.utc).isoformat()),
        "simulationCount": SIMULATION_COUNT,
        "eloDivisor":      ELO_DIVISOR,
        "hostBonus":       HOST_BONUS,
        "groupSource":     "none-prior-only",
        "method": (
            f"先验概率模式（分组数据不可用）。"
            f"加权抽样 {SIMULATION_COUNT:,} 次，ELO 除数 D={ELO_DIVISOR}，"
            f"东道主 +{HOST_BONUS} ELO。"
        ),
        "teams": teams_out,
    }


def write_predictions(predictions):
    write_json(PREDICTIONS_PATH, predictions)


def main():
    load_local_env()
    snapshot    = read_json(ELO_PATH)
    predictions = build_predictions(snapshot)
    write_predictions(predictions)
    top3 = [(t["name"], t["titleProbability"]) for t in predictions["teams"][:3]]
    print(f"[done] {len(predictions['teams'])} teams  top3={top3}")
    print(f"[done] source={predictions.get('groupSource')}  "
          f"D={predictions.get('eloDivisor')}  "
          f"host_bonus={predictions.get('hostBonus')}")


if __name__ == "__main__":
    main()
