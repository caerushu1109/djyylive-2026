"use client";

import SectionLabel from "./SectionLabel";

export default function H2HSummaryCard({ h2h, fixture, homeIso, awayIso }) {
  if (!h2h) return null;
  const summary = h2h.summary || {};
  const homeWins = summary[homeIso] ?? 0;
  const awayWins = summary[awayIso] ?? 0;
  const draws = summary.draws ?? 0;
  const total = homeWins + awayWins + draws;
  const allMatches = [...(h2h.matches || [])].reverse();

  const stageZh = {
    "group stage": "\u5c0f\u7ec4\u8d5b", "round of 16": "\u5341\u516d\u5f3a", "quarter-finals": "\u516b\u5f3a",
    "semi-finals": "\u56db\u5f3a", "final": "\u51b3\u8d5b", "third-place match": "\u5b63\u519b\u8d5b",
  };

  return (
    <div style={{
      background: "var(--card)", borderRadius: 10,
      border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
    }}>
      <div style={{ padding: "10px 14px 8px" }}>
        <SectionLabel>\u4e16\u754c\u676f\u5386\u53f2\u4ea4\u950b</SectionLabel>
      </div>
      {total === 0 ? (
        <div style={{ padding: "8px 14px 12px", fontSize: 12, color: "var(--text2)" }}>
          \u4e24\u961f\u6b64\u524d\u4ece\u672a\u5728\u4e16\u754c\u676f\u4ea4\u624b
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: "flex", gap: 4, padding: "0 14px 10px" }}>
            {[
              { value: homeWins, label: `${fixture.home.flag}\u80dc`, color: "var(--blue)" },
              { value: draws, label: "\u5e73", color: "var(--text3)" },
              { value: awayWins, label: `${fixture.away.flag}\u80dc`, color: "var(--red)" },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center",
                background: "var(--card2, rgba(255,255,255,0.04))", borderRadius: 8, padding: "8px 4px",
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: item.color, fontVariantNumeric: "tabular-nums" }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 14px 4px", fontSize: 10, color: "var(--text3)", textAlign: "center" }}>
            \u5171 {total} \u573a\u4ea4\u950b
          </div>
          {/* Full match history */}
          {allMatches.map((match, i) => {
            let tone = "dim";
            if (match.winner === homeIso) tone = "blue";
            else if (match.winner === awayIso) tone = "red";
            const scoreStr = match.pen
              ? `${match.homeScore}-${match.awayScore} (${match.homePen}-${match.awayPen}\u70b9)`
              : `${match.homeScore}-${match.awayScore}`;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                borderTop: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 11, color: "var(--text3)", minWidth: 32 }}>
                  {match.tournament.replace("WC-", "")}
                </span>
                <span style={{ flex: 1, fontSize: 11, color: "var(--text2)" }}>
                  {stageZh[match.stage] || match.stage}
                </span>
                <span style={{ fontSize: 10, color: "var(--text3)", marginRight: 2 }}>
                  {match.home} vs {match.away}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: tone === "blue" ? "var(--blue)" : tone === "red" ? "var(--red)" : "var(--text2)",
                }}>
                  {scoreStr}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
