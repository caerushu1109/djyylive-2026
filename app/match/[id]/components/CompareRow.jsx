"use client";

/* Column header badge */
export function SourceBadge({ icon, label, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, justifyContent: "center",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: color,
        display: "inline-block", flexShrink: 0,
      }} />
      <span style={{
        fontSize: 10, fontWeight: 700, color: "var(--text2)",
        letterSpacing: "0.02em",
      }}>{label}</span>
    </div>
  );
}

/* Three-column comparison row */
export function CompareRow({ label, modelVal, bookVal, bookSub, marketVal, highlight }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "56px 1fr 1fr 1fr",
      alignItems: "center", padding: "8px 12px",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>{label}</span>
      <span style={{
        textAlign: "center", fontSize: 13, fontWeight: 800,
        color: highlight === "model" ? "var(--blue)" : "var(--text)",
        fontVariantNumeric: "tabular-nums",
      }}>{modelVal ?? "\u2014"}</span>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 13, fontWeight: 800,
          color: highlight === "book" ? "var(--orange, #ff9800)" : "var(--text)",
          fontVariantNumeric: "tabular-nums",
        }}>{bookVal ?? "\u2014"}</div>
        {bookSub && (
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, marginTop: 1 }}>
            {bookSub}
          </div>
        )}
      </div>
      <span style={{
        textAlign: "center", fontSize: 12, fontWeight: 700,
        color: "var(--text3)",
        fontVariantNumeric: "tabular-nums",
      }}>{marketVal ?? "\u2014"}</span>
    </div>
  );
}

/* Discrepancy indicator bar */
export function DiscrepancyBar({ values, colors, labels }) {
  if (!values || values.length < 2) return null;
  return (
    <div style={{ padding: "8px 12px 4px" }}>
      {values.map((v, si) => (
        v && (
          <div key={si} style={{
            display: "flex", gap: 1, height: 4, borderRadius: 3, overflow: "hidden",
            marginBottom: 3, opacity: 0.9,
          }}>
            <div style={{ flex: v[0] || 1, background: "var(--blue)", borderRadius: "3px 0 0 3px" }} />
            <div style={{ flex: v[1] || 1, background: "var(--text3)" }} />
            <div style={{ flex: v[2] || 1, background: "#e05252", borderRadius: "0 3px 3px 0" }} />
          </div>
        )
      ))}
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 2,
      }}>
        {labels.map((l, i) => (
          <span key={i} style={{
            fontSize: 8, color: colors[i], fontWeight: 600, opacity: 0.7,
          }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export default CompareRow;
