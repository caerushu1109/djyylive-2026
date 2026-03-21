"use client";

import { useH2H } from "@/lib/hooks/useH2H";

const STAGE_ZH = {
  "group stage": "\u5c0f\u7ec4\u8d5b", "round of 16": "\u5341\u516d\u5f3a", "quarter-finals": "\u516b\u5f3a",
  "semi-finals": "\u56db\u5f3a", "final": "\u51b3\u8d5b", "second group stage": "\u7b2c\u4e8c\u8f6e\u5c0f\u7ec4\u8d5b",
  "third-place match": "\u5b63\u519b\u8d5b", "first round": "\u7b2c\u4e00\u8f6e", "second round": "\u7b2c\u4e8c\u8f6e",
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
          \u4e16\u754c\u676f\u4ea4\u950b vs {opponentIso}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-dim)" }}>
          \u5171 {total} \u573a
        </span>
      </div>
      {/* W/D/L summary bar */}
      <div style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 6, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
          <span><span style={{ color: "var(--green)", fontWeight: 700 }}>{myWins}</span> \u80dc</span>
          <span><span style={{ color: "var(--text3)", fontWeight: 700 }}>{draws}</span> \u5e73</span>
          <span><span style={{ color: "var(--red)", fontWeight: 700 }}>{oppWins}</span> \u8d1f</span>
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
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>\u8fd1\u671f\u4ea4\u950b</div>
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
