"use client";

export default function GroupComparisonCards({ teamElo, teamPred, groupOpponentIsos, eloData, predData }) {
  if (!teamElo || !groupOpponentIsos || groupOpponentIsos.length === 0 || !eloData) return null;

  const opponents = groupOpponentIsos.map((iso) => {
    const elo = (eloData.rankings || []).find((r) => r.code === iso);
    const pred = predData?.teams?.find((t) => t.code === iso);
    return elo ? { ...elo, pred } : null;
  }).filter(Boolean);

  if (opponents.length === 0) return null;

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 12px", borderBottom: "1px solid var(--border)",
        fontSize: 10, fontWeight: 700, color: "var(--text3)",
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        同组对手
      </div>
      {opponents.map((opp, i) => {
        const eloDiff = teamElo.elo - opp.elo;
        const probDiff = teamPred && opp.pred
          ? (teamPred.probabilityValue - opp.pred.probabilityValue) : null;
        return (
          <div key={opp.code} style={{
            padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
            borderBottom: i < opponents.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{ fontSize: 20 }}>{opp.flag}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{opp.name}</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>
                ELO {opp.elo} · 第{opp.rank}名
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                color: eloDiff > 0 ? "var(--green)" : eloDiff < 0 ? "var(--red)" : "var(--text3)",
              }}>
                ELO {opp.elo}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", fontVariantNumeric: "tabular-nums" }}>
                {eloDiff > 0 ? "高" : "低"} {Math.abs(eloDiff)} 分
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
