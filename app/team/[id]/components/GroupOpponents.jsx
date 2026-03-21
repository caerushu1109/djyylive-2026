"use client";

import { useH2H } from "@/lib/hooks/useH2H";

const STAGE_ZH = {
  "group stage": "小组赛", "round of 16": "十六强", "quarter-finals": "八强",
  "semi-finals": "四强", "final": "决赛", "second group stage": "第二轮小组赛",
  "third-place match": "季军赛", "first round": "第一轮", "second round": "第二轮",
};

// ── Single opponent card: ELO comparison + H2H record ─────────────────────
function OpponentCard({ teamElo, opp, teamIso, oppIso }) {
  const { data: h2h } = useH2H(teamIso, oppIso);
  const eloDiff = teamElo.elo - opp.elo;

  const myWins = h2h?.summary?.[teamIso] || 0;
  const oppWins = h2h?.summary?.[oppIso] || 0;
  const draws = h2h?.summary?.draws || 0;
  const total = myWins + oppWins + draws;
  const recentMatches = h2h ? [...h2h.matches].reverse().slice(0, 3) : [];

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      {/* Header: flag + name + ELO */}
      <div style={{
        padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
        borderBottom: (total > 0) ? "1px solid var(--border)" : "none",
      }}>
        <span style={{ fontSize: 22 }}>{opp.flag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{opp.name}</div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>
            ELO {opp.elo} · 世界第{opp.rank}名
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums",
            color: eloDiff > 0 ? "var(--green)" : eloDiff < 0 ? "var(--red)" : "var(--text3)",
          }}>
            {eloDiff > 0 ? "+" : ""}{eloDiff}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-dim)" }}>ELO差</div>
        </div>
      </div>

      {/* H2H section (only if there's history) */}
      {total > 0 && (
        <div style={{ padding: "8px 12px" }}>
          {/* W/D/L row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "var(--text-dim)", marginRight: 2 }}>世界杯交锋</span>
            <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "var(--green)", fontWeight: 700 }}>{myWins}</span>
              <span style={{ color: "var(--text-dim)" }}>胜</span>
            </span>
            <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "var(--text3)", fontWeight: 700 }}>{draws}</span>
              <span style={{ color: "var(--text-dim)" }}>平</span>
            </span>
            <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "var(--red)", fontWeight: 700 }}>{oppWins}</span>
              <span style={{ color: "var(--text-dim)" }}>负</span>
            </span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)" }}>
              共{total}场
            </span>
          </div>
          {/* W/D/L bar */}
          <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${(myWins / total) * 100}%`, background: "var(--green)" }} />
            <div style={{ width: `${(draws / total) * 100}%`, background: "var(--text3)" }} />
            <div style={{ width: `${(oppWins / total) * 100}%`, background: "var(--red)" }} />
          </div>
          {/* Recent matches */}
          {recentMatches.length > 0 && (
            <div>
              {recentMatches.map((m, i) => {
                const year = m.date.split("-")[0];
                const stageLabel = STAGE_ZH[m.stage?.toLowerCase()] || m.stage;
                const isWin = m.winner === teamIso;
                const isLoss = m.winner === oppIso;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "2px 0",
                  }}>
                    <span style={{ color: "var(--text-dim)", fontSize: 10, minWidth: 30 }}>{year}</span>
                    <span style={{ color: "var(--text-dim)", fontSize: 10 }}>{stageLabel}</span>
                    <span style={{
                      fontWeight: 700, fontVariantNumeric: "tabular-nums",
                      padding: "1px 5px", borderRadius: 3, marginLeft: "auto",
                      background: isWin ? "var(--green-dim)" : isLoss ? "var(--red-dim)" : "var(--card2)",
                      color: isWin ? "var(--green)" : isLoss ? "var(--red)" : "var(--text2)",
                    }}>
                      {m.homeScore}-{m.awayScore}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export: renders one card per group opponent ───────────────────────
export default function GroupComparisonCards({ teamElo, teamIso, groupOpponentIsos, eloData }) {
  if (!teamElo || !groupOpponentIsos || groupOpponentIsos.length === 0 || !eloData) return null;

  const opponents = groupOpponentIsos.map((iso) => {
    const elo = (eloData.rankings || []).find((r) => r.code === iso);
    return elo ? { ...elo, iso } : null;
  }).filter(Boolean);

  if (opponents.length === 0) return null;

  return (
    <>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "var(--text3)",
        textTransform: "uppercase", letterSpacing: "0.06em",
        padding: "4px 0 0",
      }}>
        同组对手
      </div>
      {opponents.map((opp) => (
        <OpponentCard
          key={opp.code}
          teamElo={teamElo}
          opp={opp}
          teamIso={teamIso}
          oppIso={opp.code}
        />
      ))}
    </>
  );
}
