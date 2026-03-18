export default function GroupTable({ group }) {
  if (!group) return null;
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 14px",
        background: "rgba(92,158,255,0.06)",
        borderBottom: "1px solid var(--border)",
        fontSize: 13, fontWeight: 700, color: "var(--blue)",
      }}>
        {group.group}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "20px 1fr 28px 28px 28px 28px 38px 32px",
        gap: 4, padding: "4px 14px",
        fontSize: 11, color: "var(--text-dim)", fontWeight: 600,
      }}>
        <span>#</span><span></span>
        <span style={{ textAlign: "center" }}>场</span>
        <span style={{ textAlign: "center" }}>胜</span>
        <span style={{ textAlign: "center" }}>平</span>
        <span style={{ textAlign: "center" }}>负</span>
        <span style={{ textAlign: "center" }}>净</span>
        <span style={{ textAlign: "right" }}>积</span>
      </div>

      {group.rows.map((row, i) => {
        const isAdvance = row.pos <= 2;
        return (
          <div
            key={row.name}
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr 28px 28px 28px 28px 38px 32px",
              gap: 4, padding: "8px 14px", alignItems: "center",
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
              background: isAdvance ? "rgba(0,230,118,0.03)" : "transparent",
            }}
          >
            <span style={{ fontSize: 12, color: isAdvance ? "var(--green)" : "var(--text-dim)" }}>
              {row.pos}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <span style={{ fontSize: 18 }}>{row.flag}</span>
              <span style={{
                fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontWeight: isAdvance ? 600 : 400,
              }}>{row.name}</span>
            </div>
            {[row.p, row.w, row.d, row.l].map((v, idx) => (
              <span key={idx} style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)" }}>{v}</span>
            ))}
            <span style={{
              textAlign: "center", fontSize: 13,
              color: row.gd > 0 ? "var(--green)" : row.gd < 0 ? "var(--red)" : "var(--text-dim)",
            }}>
              {row.gd > 0 ? `+${row.gd}` : row.gd}
            </span>
            <span style={{
              textAlign: "right", fontSize: 14, fontWeight: 700,
              color: isAdvance ? "var(--green)" : "var(--text)",
            }}>{row.pts}</span>
          </div>
        );
      })}

      <div style={{ padding: "6px 14px", borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--green)" }}>● 晋级淘汰赛</span>
      </div>
    </div>
  );
}
