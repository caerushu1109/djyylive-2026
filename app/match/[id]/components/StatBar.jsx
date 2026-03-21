"use client";

export function StatBar({ label, left, right, leftWidth, highlight }) {
  const isHighlightLeft = highlight && parseFloat(left) > parseFloat(right);
  const isHighlightRight = highlight && parseFloat(right) > parseFloat(left);
  return (
    <div style={{ padding: "8px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{
          fontSize: 12, fontWeight: isHighlightLeft ? 800 : 600,
          color: isHighlightLeft ? "var(--blue)" : "var(--text2)",
          fontVariantNumeric: "tabular-nums",
        }}>{left}</span>
        <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>{label}</span>
        <span style={{
          fontSize: 12, fontWeight: isHighlightRight ? 800 : 600,
          color: isHighlightRight ? "var(--red)" : "var(--text2)",
          fontVariantNumeric: "tabular-nums",
        }}>{right}</span>
      </div>
      <div style={{
        display: "flex", gap: 3, height: 4, borderRadius: 2,
      }}>
        <div style={{
          flex: leftWidth, height: "100%", borderRadius: "2px 0 0 2px",
          background: isHighlightLeft ? "var(--blue)" : "rgba(100,130,180,0.25)",
          transition: "flex 0.3s",
        }} />
        <div style={{
          flex: 100 - leftWidth, height: "100%", borderRadius: "0 2px 2px 0",
          background: isHighlightRight ? "var(--red)" : "rgba(180,100,100,0.25)",
          transition: "flex 0.3s",
        }} />
      </div>
    </div>
  );
}

export function KeyStatPill({ label, homeVal, awayVal }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, textAlign: "center",
      background: "var(--card)", borderRadius: 8, padding: "10px 4px",
    }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 15, fontWeight: 800, color: "var(--blue)",
          fontVariantNumeric: "tabular-nums",
        }}>{homeVal}</span>
        <span style={{ fontSize: 10, color: "var(--text3)", alignSelf: "center" }}>vs</span>
        <span style={{
          fontSize: 15, fontWeight: 800, color: "var(--red)",
          fontVariantNumeric: "tabular-nums",
        }}>{awayVal}</span>
      </div>
      <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
    </div>
  );
}

export default StatBar;
