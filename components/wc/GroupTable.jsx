"use client";

export default function GroupTable({ group, polyGroupOdds }) {
  if (!group) return null;
  const { group: name, rows = [] } = group;

  // 2026 WC: 第1/2名直接晋级（绿），第3名参与最佳第三名竞争（蓝），第4名淘汰（灰）
  function barColor(pos) {
    if (pos <= 2) return "var(--green)";
    if (pos === 3) return "var(--blue)";
    return "var(--border2)";
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
      <div style={{ padding: "5px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 3, height: 12, background: "var(--green)", borderRadius: 2, display: "inline-block" }} />
          直接晋级（前2名）
        </span>
        <span style={{ fontSize: 9, color: "var(--blue)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 3, height: 12, background: "var(--blue)", borderRadius: 2, display: "inline-block" }} />
          最佳第三名竞争（12组取8）
        </span>
        <span style={{ fontSize: 9, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 3, height: 12, background: "var(--border2)", borderRadius: 2, display: "inline-block" }} />
          淘汰
        </span>
      </div>

      {/* Polymarket group winner odds */}
      {polyGroupOdds && Object.keys(polyGroupOdds).length > 0 && (
        <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 6,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: "var(--text3)",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>POLYMARKET · 小组冠军</span>
          </div>
          {/* Stacked bar */}
          <div style={{
            display: "flex", height: 6, borderRadius: 4, overflow: "hidden",
            marginBottom: 6, gap: 1,
          }}>
            {Object.entries(polyGroupOdds)
              .sort((a, b) => b[1] - a[1])
              .map(([teamName, prob]) => {
                const matchRow = rows.find((r) =>
                  r.originalName === teamName || r.name === teamName
                );
                return (
                  <div key={teamName} style={{
                    flex: prob,
                    background: matchRow ? barColor(matchRow.pos) : "var(--text3)",
                    minWidth: prob > 2 ? 2 : 0,
                  }} />
                );
              })}
          </div>
          {/* Labels */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
            {Object.entries(polyGroupOdds)
              .sort((a, b) => b[1] - a[1])
              .map(([teamName, prob]) => {
                const matchRow = rows.find((r) =>
                  r.originalName === teamName || r.name === teamName
                );
                return (
                  <div key={teamName} style={{
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 10, color: "var(--text2)" }}>
                      {matchRow?.flag || ""} {matchRow?.name || teamName}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: "var(--text)",
                      fontVariantNumeric: "tabular-nums",
                    }}>{prob}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
