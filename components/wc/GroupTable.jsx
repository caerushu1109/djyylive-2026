"use client";

export default function GroupTable({ group }) {
  if (!group) return null;
  const { group: name, rows = [] } = group;

  function barColor(pos) {
    if (pos <= 2) return "var(--green)";
    return "var(--text3)";
  }

  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        background: "var(--card2)",
        borderBottom: "1px solid var(--border)",
        gap: 8,
      }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>{name}</span>
        <div style={{ display: "flex", marginLeft: "auto" }}>
          {["P", "W", "D", "L", "GD", "PTS"].map(col => (
            <span
              key={col}
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "var(--text3)",
                width: 24,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={row.name}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            gap: 6,
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <span style={{ fontSize: 10, color: "var(--text3)", width: 14, fontWeight: 700 }}>{row.pos}</span>
          <div
            style={{
              width: 3,
              height: 24,
              borderRadius: 3,
              background: barColor(row.pos),
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 16 }}>{row.flag}</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.name}
          </span>
          {[row.p, row.w, row.d, row.l].map((v, idx) => (
            <span
              key={idx}
              style={{
                fontSize: 11,
                color: "var(--text2)",
                width: 24,
                textAlign: "center",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v}
            </span>
          ))}
          <span
            style={{
              fontSize: 11,
              color: row.gd > 0 ? "var(--green)" : row.gd < 0 ? "var(--red)" : "var(--text2)",
              width: 24,
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.gd > 0 ? `+${row.gd}` : row.gd}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "var(--text)",
              width: 24,
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.pts}
          </span>
        </div>
      ))}

      {/* Legend */}
      <div style={{ padding: "5px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 12 }}>
        <span style={{ fontSize: 10, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 3, height: 12, background: "var(--green)", borderRadius: 2, display: "inline-block" }} />
          晋级淘汰赛
        </span>
      </div>
    </div>
  );
}
