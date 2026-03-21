"use client";

import { useH2H } from "@/lib/hooks/useH2H";

const STAGE_ZH = {
  "group stage": "小组赛", "round of 16": "十六强", "quarter-finals": "八强",
  "semi-finals": "四强", "final": "决赛", "second group stage": "第二轮小组赛",
  "third-place match": "季军赛", "first round": "第一轮", "second round": "第二轮",
};

export function H2HCard({ teamIso, opponentIso, teamName }) {
  const { data } = useH2H(teamIso, opponentIso);
  if (!data || data.matches.length === 0) return null;

  const myWins = data.summary[teamIso] || 0;
  const oppWins = data.summary[opponentIso] || 0;
  const draws = data.summary.draws || 0;
  const total = myWins + oppWins + draws;
  const recentMatches = [...data.matches].reverse().slice(0, 3);

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 12px", display: "flex", alignItems: "center", gap: 6,
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          世界杯交锋 vs {opponentIso}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-dim)" }}>
          共 {total} 场
        </span>
      </div>
      {/* W/D/L summary bar */}
      <div style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 6, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
          <span><span style={{ color: "var(--green)", fontWeight: 700 }}>{myWins}</span> 胜</span>
          <span><span style={{ color: "var(--text3)", fontWeight: 700 }}>{draws}</span> 平</span>
          <span><span style={{ color: "var(--red)", fontWeight: 700 }}>{oppWins}</span> 负</span>
        </div>
        {total > 0 && (
          <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${(myWins / total) * 100}%`, background: "var(--green)" }} />
            <div style={{ width: `${(draws / total) * 100}%`, background: "var(--text3)" }} />
            <div style={{ width: `${(oppWins / total) * 100}%`, background: "var(--red)" }} />
          </div>
        )}
      </div>
      {/* Recent matches */}
      {recentMatches.length > 0 && (
        <div style={{ padding: "0 12px 8px" }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>近期交锋</div>
          {recentMatches.map((m, i) => {
            const year = m.date.split("-")[0];
            const stageLabel = STAGE_ZH[m.stage?.toLowerCase()] || m.stage;
            const isWin = m.winner === teamIso;
            const isLoss = m.winner === opponentIso;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 0",
              }}>
                <span style={{ color: "var(--text-dim)", fontSize: 10, minWidth: 32 }}>{year}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 10, minWidth: 40 }}>{stageLabel}</span>
                <span style={{
                  fontWeight: 700, fontVariantNumeric: "tabular-nums",
                  padding: "1px 5px", borderRadius: 3,
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
  );
}

export function H2HSection({ teamIso, groupOpponentIsos }) {
  if (!teamIso || !groupOpponentIsos || groupOpponentIsos.length === 0) return null;
  return (
    <>
      {groupOpponentIsos.map((oppIso) => (
        <H2HCard key={oppIso} teamIso={teamIso} opponentIso={oppIso} />
      ))}
    </>
  );
}

export default H2HCard;
