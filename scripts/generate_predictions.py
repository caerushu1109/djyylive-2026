#!/usr/bin/env python3
"""
WC2026 Monte Carlo – 6 stage probabilities (corrected real bracket)
Uses actual FIFA WC2026 R32 bracket structure (Matches 73-88 per FIFA rules).

Real bracket key points:
  Match 84 (R32): Winner H  (Spain)     vs Runner-up J  (Argentina's runner-up)
  Match 86 (R32): Winner J  (Argentina) vs Runner-up H  (Uruguay)
  Match 93 (R16): Winner M83 vs Winner M84  → Spain's R16
  Match 95 (R16): Winner M86 vs Winner M88  → Argentina's R16
  Match 98 (QF):  Winner M93 vs Winner M94  → Spain's QF
  Match 100 (QF): Winner M95 vs Winner M96  → Argentina's QF
  Match 101 (SF): Winner M97 vs Winner M98  → Spain's SF
  Match 102 (SF): Winner M99 vs Winner M100 → Argentina's SF
  Match 103 (Final): SF winners

Stages: 1=小组出线, 2=进16强, 3=进8强, 4=进4强, 5=进决赛, 6=夺冠
Outputs: /sessions/upbeat-optimistic-ritchie/predictions_new.json
"""
import json
import random
from collections import defaultdict
from pathlib import Path

ELO_DIVISOR      = 515
HOST_BONUS       = 60
HOST_CODES       = {"US", "CA", "MX"}
DRAW_BASE        = 0.22
DRAW_DECAY       = 400
SIMULATION_COUNT = 10_000
RANDOM_SEED      = 20260313

# ── Static data ─────────────────────────────────────────────────────────────

ELO_MAP = {
    "ES":2172,"AR":2113,"FR":2062,"EN":2042,"CO":1998,"BR":1978,
    "PT":1976,"NL":1959,"EC":1933,"HR":1932,"NO":1922,"DE":1910,
    "CH":1897,"UY":1890,"JP":1878,"SN":1869,"MX":1857,"BE":1850,
    "PY":1833,"AT":1818,"MA":1806,"CA":1805,"SQ":1790,"KR":1784,
    "AU":1774,"IR":1755,"US":1747,"PA":1733,"DZ":1728,"UZ":1728,
    "JO":1689,"EG":1659,"CI":1637,"TN":1614,"SA":1592,"NZ":1585,
    "CV":1561,"HT":1542,"ZA":1528,"GH":1509,"CW":1466,"QA":1425,
    # Playoff TBD spots (estimated avg ELO)
    "TBD_A":1492,"TBD_B":1731,"TBD_D":1719,"TBD_F":1715,
    "TBD_I":1687,"TBD_K":1650,
}

TEAM_META = {
    "ES":{"flag":"\U0001f1ea\U0001f1f8","name":"西班牙"},
    "AR":{"flag":"\U0001f1e6\U0001f1f7","name":"阿根廷"},
    "FR":{"flag":"\U0001f1eb\U0001f1f7","name":"法国"},
    "EN":{"flag":"\U0001f3f4\U000e0067\U000e0062\U000e0065\U000e006e\U000e0067\U000e007f","name":"英格兰"},
    "CO":{"flag":"\U0001f1e8\U0001f1f4","name":"哥伦比亚"},
    "BR":{"flag":"\U0001f1e7\U0001f1f7","name":"巴西"},
    "PT":{"flag":"\U0001f1f5\U0001f1f9","name":"葡萄牙"},
    "NL":{"flag":"\U0001f1f3\U0001f1f1","name":"荷兰"},
    "EC":{"flag":"\U0001f1ea\U0001f1e8","name":"厄瓜多尔"},
    "HR":{"flag":"\U0001f1ed\U0001f1f7","name":"克罗地亚"},
    "NO":{"flag":"\U0001f1f3\U0001f1f4","name":"挪威"},
    "DE":{"flag":"\U0001f1e9\U0001f1ea","name":"德国"},
    "CH":{"flag":"\U0001f1e8\U0001f1ed","name":"瑞士"},
    "UY":{"flag":"\U0001f1fa\U0001f1fe","name":"乌拉圭"},
    "JP":{"flag":"\U0001f1ef\U0001f1f5","name":"日本"},
    "SN":{"flag":"\U0001f1f8\U0001f1f3","name":"塞内加尔"},
    "MX":{"flag":"\U0001f1f2\U0001f1fd","name":"墨西哥"},
    "BE":{"flag":"\U0001f1e7\U0001f1ea","name":"比利时"},
    "PY":{"flag":"\U0001f1f5\U0001f1fe","name":"巴拉圭"},
    "AT":{"flag":"\U0001f1e6\U0001f1f9","name":"奥地利"},
    "MA":{"flag":"\U0001f1f2\U0001f1e6","name":"摩洛哥"},
    "CA":{"flag":"\U0001f1e8\U0001f1e6","name":"加拿大"},
    "SQ":{"flag":"\U0001f3f4\U000e0067\U000e0062\U000e0073\U000e0063\U000e0074\U000e007f","name":"苏格兰"},
    "KR":{"flag":"\U0001f1f0\U0001f1f7","name":"韩国"},
    "AU":{"flag":"\U0001f1e6\U0001f1fa","name":"澳大利亚"},
    "IR":{"flag":"\U0001f1ee\U0001f1f7","name":"伊朗"},
    "US":{"flag":"\U0001f1fa\U0001f1f8","name":"美国"},
    "PA":{"flag":"\U0001f1f5\U0001f1e6","name":"巴拿马"},
    "DZ":{"flag":"\U0001f1e9\U0001f1ff","name":"阿尔及利亚"},
    "UZ":{"flag":"\U0001f1fa\U0001f1ff","name":"乌兹别克斯坦"},
    "JO":{"flag":"\U0001f1ef\U0001f1f4","name":"约旦"},
    "EG":{"flag":"\U0001f1ea\U0001f1ec","name":"埃及"},
    "CI":{"flag":"\U0001f1e8\U0001f1ee","name":"科特迪瓦"},
    "TN":{"flag":"\U0001f1f9\U0001f1f3","name":"突尼斯"},
    "SA":{"flag":"\U0001f1f8\U0001f1e6","name":"沙特阿拉伯"},
    "NZ":{"flag":"\U0001f1f3\U0001f1ff","name":"新西兰"},
    "CV":{"flag":"\U0001f1e8\U0001f1fb","name":"佛得角"},
    "HT":{"flag":"\U0001f1ed\U0001f1f9","name":"海地"},
    "ZA":{"flag":"\U0001f1ff\U0001f1e6","name":"南非"},
    "GH":{"flag":"\U0001f1ec\U0001f1ed","name":"加纳"},
    "CW":{"flag":"\U0001f1e8\U0001f1fc","name":"库拉索"},
    "QA":{"flag":"\U0001f1f6\U0001f1e6","name":"卡塔尔"},
}

GROUPS = {
    "A":[{"code":"MX"},{"code":"ZA"},{"code":"KR"},{"code":"TBD_A"}],
    "B":[{"code":"CA"},{"code":"TBD_B"},{"code":"QA"},{"code":"CH"}],
    "C":[{"code":"BR"},{"code":"MA"},{"code":"HT"},{"code":"SQ"}],
    "D":[{"code":"US"},{"code":"PY"},{"code":"AU"},{"code":"TBD_D"}],
    "E":[{"code":"DE"},{"code":"CW"},{"code":"CI"},{"code":"EC"}],
    "F":[{"code":"NL"},{"code":"JP"},{"code":"TBD_F"},{"code":"TN"}],
    "G":[{"code":"BE"},{"code":"EG"},{"code":"IR"},{"code":"NZ"}],
    "H":[{"code":"ES"},{"code":"CV"},{"code":"SA"},{"code":"UY"}],
    "I":[{"code":"FR"},{"code":"SN"},{"code":"TBD_I"},{"code":"NO"}],
    "J":[{"code":"AR"},{"code":"DZ"},{"code":"AT"},{"code":"JO"}],
    "K":[{"code":"PT"},{"code":"TBD_K"},{"code":"UZ"},{"code":"CO"}],
    "L":[{"code":"EN"},{"code":"HR"},{"code":"GH"},{"code":"PA"}],
}

# ── Real FIFA WC2026 R32 bracket (Matches 73-88) ────────────────────────────
#
# Each R32 match is described as a pair of "slot specs".
# Slot spec types:
#   ("W", "X")  → Winner of Group X
#   ("R", "X")  → Runner-up of Group X
#   ("T", idx)  → Best 3rd-place team assigned to this slot
#
# Index in R32_SPECS list = 0-based match offset (M73=0, M74=1, ... M88=15)

R32_SPECS = [
    # M73
    [("R","A"), ("R","B")],
    # M74 – 3rd-place slot (eligible groups A,B,C,D,F)
    [("W","E"), ("T", frozenset("ABCDF"))],
    # M75
    [("W","F"), ("R","C")],
    # M76
    [("W","C"), ("R","F")],
    # M77 – 3rd-place slot (eligible groups C,D,F,G,H)
    [("W","I"), ("T", frozenset("CDFGH"))],
    # M78
    [("R","E"), ("R","I")],
    # M79 – 3rd-place slot (eligible groups C,E,F,H,I)
    [("W","A"), ("T", frozenset("CEFHI"))],
    # M80 – 3rd-place slot (eligible groups E,H,I,J,K)
    [("W","L"), ("T", frozenset("EHIJK"))],
    # M81 – 3rd-place slot (eligible groups B,E,F,I,J)
    [("W","D"), ("T", frozenset("BEFIJ"))],
    # M82 – 3rd-place slot (eligible groups A,E,H,I,J)
    [("W","G"), ("T", frozenset("AEHIJ"))],
    # M83
    [("R","K"), ("R","L")],
    # M84 ← SPAIN:  H winner vs J runner-up
    [("W","H"), ("R","J")],
    # M85 – 3rd-place slot (eligible groups E,F,G,I,J)
    [("W","B"), ("T", frozenset("EFGIJ"))],
    # M86 ← ARGENTINA:  J winner vs H runner-up
    [("W","J"), ("R","H")],
    # M87 – 3rd-place slot (eligible groups D,E,I,J,L)
    [("W","K"), ("T", frozenset("DEIJL"))],
    # M88
    [("R","D"), ("R","G")],
]

# R16 pairings: each entry is (r32_idx_a, r32_idx_b) → produces r16[i]
# Order chosen so that Spain (r32[11]) is in r16[4] and Argentina (r32[13]) is in r16[6]
R16_PAIRS = [
    ( 0,  1),   # M89 → r16[0]
    ( 2,  3),   # M90 → r16[1]
    ( 4,  5),   # M91 → r16[2]
    ( 6,  7),   # M92 → r16[3]
    (10, 11),   # M93 → r16[4]  ← Spain's R16
    ( 8,  9),   # M94 → r16[5]
    (13, 15),   # M95 → r16[6]  ← Argentina's R16
    (12, 14),   # M96 → r16[7]
]

# QF pairings: each entry is (r16_idx_a, r16_idx_b) → produces qf[i]
QF_PAIRS = [
    (0, 1),   # M97 → qf[0]
    (4, 5),   # M98 → qf[1]  ← Spain's QF
    (2, 3),   # M99 → qf[2]
    (6, 7),   # M100 → qf[3]  ← Argentina's QF
]

# SF pairings: each entry is (qf_idx_a, qf_idx_b) → produces sf[i]
SF_PAIRS = [
    (0, 1),   # M101 → sf[0]  ← Spain's SF
    (2, 3),   # M102 → sf[1]  ← Argentina's SF
]

# Final: sf[0] vs sf[1]


# ── ELO model ─────────────────────────────────────────────────────────────────

def win_prob(elo_a, elo_b):
    return 1.0 / (1.0 + 10.0 ** ((elo_b - elo_a) / ELO_DIVISOR))

def draw_prob(elo_a, elo_b):
    gap = abs(elo_a - elo_b)
    return max(0.0, DRAW_BASE * (1.0 - gap / DRAW_DECAY))

def group_match(a, b):
    pa = win_prob(a["elo"], b["elo"])
    pd = draw_prob(a["elo"], b["elo"])
    r  = random.random()
    if r < pd:
        return 1, 1, 0
    gd = random.choices([1, 2, 3], weights=[50, 35, 15])[0]
    if r < pd + pa:
        return 3, 0, gd
    return 0, 3, -gd

def ko_winner(a, b):
    return a if random.random() < win_prob(a["elo"], b["elo"]) else b


# ── Group stage ──────────────────────────────────────────────────────────────

def simulate_group(teams):
    stats = {t["code"]: {"team": t, "pts": 0, "gd": 0, "gf": 0} for t in teams}
    pairs = [(teams[i], teams[j]) for i in range(4) for j in range(i+1, 4)]
    for a, b in pairs:
        pa, pb, gd_a = group_match(a, b)
        sa, sb = stats[a["code"]], stats[b["code"]]
        sa["pts"] += pa; sa["gd"] += gd_a
        sb["pts"] += pb; sb["gd"] -= gd_a
        if gd_a > 0:   sa["gf"] += gd_a
        elif gd_a < 0: sb["gf"] += -gd_a
        else:          sa["gf"] += 1; sb["gf"] += 1
    return sorted(stats.values(),
                  key=lambda s: (-s["pts"], -s["gd"], -s["gf"], s["team"]["code"]))

def select_best_thirds(thirds):
    """Return the 8 best 3rd-place teams with their group labels, sorted best first."""
    ranked = sorted(thirds, key=lambda x: (-x[1]["pts"], -x[1]["gd"], -x[1]["gf"]))
    return [(g, s["team"]) for g, s in ranked[:8]]


# ── Third-place team assignment ───────────────────────────────────────────────

def assign_thirds(best_thirds_with_groups):
    """
    Assign the 8 best 3rd-place teams to their valid R32 slots via backtracking.
    Returns dict: [r32_match_index: team_dict}
    """
    # Collect the T-type slots from R32_SPECS
    slots = []   # list of (r32_idx, eligible_frozenset)
    for idx, spec in enumerate(R32_SPECS):
        for side in spec:
            if side[0] == "T":
                slots.append((idx, side[1]))
                break

    # Randomise order to avoid systematic bias
    pool = list(best_thirds_with_groups)  # [(group, team), ...]
    random.shuffle(pool)

    assignment = {}
    used = [False] * 8

    def backtrack(slot_i):
        if slot_i == len(slots):
            return True
        r32_idx, eligible = slots[slot_i]
        for team_i in range(8):
            if not used[team_i] and pool[team_i][0] in eligible:
                assignment[r32_idx] = pool[team_i][1]
                used[team_i] = True
                if backtrack(slot_i + 1):
                    return True
                used[team_i] = False
                del assignment[r32_idx]
        return False

    if backtrack(0):
        return assignment

    # Fallback: assign in order ignoring eligibility (should not normally happen)
    result = {}
    for i, (r32_idx, _) in enumerate(slots):
        result[r32_idx] = pool[i % 8][1]
    return result


# ── Build R32 bracket ─────────────────────────────────────────────────────────

def build_r32(group_results, best_thirds_with_groups):
    """Return list of 16 (teamA, teamB) tuples using the real FIFA bracket."""
    W = lambda g: group_results[g][0]["team"]
    R = lambda g: group_results[g][1]["team"]

    third_map = assign_thirds(best_thirds_with_groups)

    r32 = []
    for idx, spec in enumerate(R32_SPECS):
        sides = []
        for kind, val in spec:
            if kind == "W":
                sides.append(W(val))
            elif kind == "R":
                sides.append(R(val))
            else:  # "T"
                sides.append(third_map[idx])
        r32.append(tuple(sides))
    return r32


# ── Full tournament simulation ────────────────────────────────────────────────

def simulate_tournament():
    """Returns {code: stage_reached}  0=group-out, 1=qualify, 2=R16, 3=QF, 4=SF, 5=final, 6=champion"""

    def enrich(t):
        base  = ELO_MAP.get(t["code"], 1600)
        bonus = HOST_BONUS if t["code"] in HOST_CODES else 0
        return {**t, "elo": base + bonus}

    enriched = {g: [enrich(t) for t in teams] for g, teams in GROUPS.items()}

    stages = {t["code"]: 0 for teams in enriched.values() for t in teams}

    # ── Group stage ──
    group_results = {}
    thirds = []
    for g, teams in enriched.items():
        ranked = simulate_group(teams)
        group_results[g] = ranked
        stages[ranked[0]["team"]["code"]] = 1
        stages[ranked[1]["team"]["code"]] = 1
        thirds.append((g, ranked[2]))

    best_thirds = select_best_thirds(thirds)  # [(group, team), ...]
    for _, t in best_thirds:
        stages[t["code"]] = 1

    # ── R32 ──
    r32 = build_r32(group_results, best_thirds)
    r32_winners = [ko_winner(a, b) for a, b in r32]
    for t in r32_winners:
        stages[t["code"]] = 2

    # ── R16 ──
    r16_teams = [ko_winner(r32_winners[a], r32_winners[b]) for a, b in R16_PAIRS]
    for t in r16_teams:
        stages[t["code"]] = 3

    # ── QF ──
    qf_teams = [ko_winner(r16_teams[a], r16_teams[b]) for a, b in QF_PAIRS]
    for t in qf_teams:
        stages[t["code"]] = 4

    # ── SF ──
    sf_teams = [ko_winner(qf_teams[a], qf_teams[b]) for a, b in SF_PAIRS]
    for t in sf_teams:
        stages[t["code"]] = 5

    # ── Final ──
    champion = ko_winner(sf_teams[0], sf_teams[1])
    stages[champion["code"]] = 6

    return stages


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    random.seed(RANDOM_SEED)

    stage_counts = defaultdict(lambda: [0] * 7)

    print(f"Running {SIMULATION_COUNT:,} simulations (real FIFA WC2026 bracket)...")
    for i in range(SIMULATION_COUNT):
        if i % 2000 == 0:
            print(f"  {i}/{SIMULATION_COUNT}")
        result = simulate_tournament()
        for code, stage in result.items():
            for s in range(1, stage + 1):
                stage_counts[code][s] += 1

    real_codes = sorted(
        [c for c in stage_counts if not c.startswith("TBD")],
        key=lambda c: -stage_counts[c][6]
    )

    N = SIMULATION_COUNT
    max_wins = stage_counts[real_codes[0]][6] if real_codes else 1

    teams_out = []
    for rank, code in enumerate(real_codes, 1):
        meta = TEAM_META.get(code, {"flag": "\U0001f3f3\ufe0f", "name": code})
        cnt  = stage_counts[code]
        base_elo  = ELO_MAP.get(code, 1600)
        bonus_elo = base_elo + (HOST_BONUS if code in HOST_CODES else 0)
        pct6 = round(cnt[6] / N * 100, 2)
        teams_out.append({
            "rank":  rank,
            "flag":  meta["flag"],
            "name":  meta["name"],
            "code":  code,
            "elo":   base_elo,
            "eloWithBonus": bonus_elo,
            "isHost": code in HOST_CODES,
            "titleProbability": f"{pct6:.1f}%",
            "probabilityValue": pct6,
            "wins":  cnt[6],
            "width": max(6, round(cnt[6] / max_wins * 100)),
            "pQualify": round(cnt[1] / N * 100, 1),
            "pR16":     round(cnt[2] / N * 100, 1),
            "pQF":      round(cnt[3] / N * 100, 1),
            "pSF":      round(cnt[4] / N * 100, 1),
            "pFinal":   round(cnt[5] / N * 100, 1),
            "pChampion":round(cnt[6] / N * 100, 1),
        })

    output = {
        "updatedAt": "2026-03-20T00:00:00+00:00",
        "simulationCount": N,
        "eloDivisor": ELO_DIVISOR,
        "hostBonus": HOST_BONUS,
        "groupSource": "local-cache",
        "method": (
            f"完整赛程蒙特卡洛模拟 {N:,} 次，使用2026年世界杯真实淘汰赛赛制。"
            f"ELO 胜率除数 D={ELO_DIVISOR}。"
            f"东道主美国/加拿大/墨西哥各 +{HOST_BONUS} ELO。"
            f"淘汰赛对阵：M84=H冠军(西班牙) vs J亚军，M86=J冠军(阿根廷) vs H亚军，"
            f"路径：小组赛→最佳第三名→R32→R16→QF→SF→决赛。"
        ),
        "teams": teams_out,
    }

    out_path = Path("/sessions/upbeat-optimistic-ritchie/predictions_new.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        f.write("\n")

    top5 = [(t["name"], t["titleProbability"], t["pQualify"]) for t in teams_out[:5]]
    print(f"\nDone! {len(teams_out)} teams written to {out_path}")
    print(f"Top 5: {top5}")

    # Print Spain and Argentina specifically
    for t in teams_out:
        if t["code"] in ("ES","AR","FR","EN","PT","BR"):
            print(f"  {t['name']}: {t['titleProbability']} (pR16={t['pR16']}%, pQF={t['pQF']}%, pSF={t['pSF']}%, pFinal={t['pFinal']}%)")


if __name__ == "__main__":
    main()
