"use client";

import SectionLabel from "./SectionLabel";

export default function CompactModelSummary({ poissonOdds, fixture, onSwitchTab }) {
  if (!poissonOdds) return null;
  const { result } = poissonOdds;
  return (
    <div
      onClick={() => onSwitchTab?.("analysis")}
      style={{
        background: "var(--card)", borderRadius: 10, padding: "10px 14px",
        border: "1px solid var(--border)", marginBottom: 10, cursor: "pointer",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 6,
      }}>
        <SectionLabel>\u6a21\u578b\u9884\u6d4b</SectionLabel>
        <span style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>
          \u67e5\u770b\u8be6\u7ec6\u5206\u6790 \u2192
        </span>
      </div>
      <div style={{ display: "flex", gap: 2, height: 5, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ flex: result.homeWin, background: "var(--blue)", borderRadius: "5px 0 0 5px" }} />
        <div style={{ flex: result.draw, background: "var(--text3)" }} />
        <div style={{ flex: result.awayWin, background: "#e05252", borderRadius: "0 5px 5px 0" }} />
      </div>
    </div>
  );
}
