"use client";

// W/D/L Stacked Bar (local to this tab)
function WDLBar({ w, d, l }) {
  const total = w + d + l;
  if (total === 0) return null;
  const wPct = (w / total) * 100;
  const dPct = (d / total) * 100;
  const lPct = (l / total) * 100;
  return (
    <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${wPct}%`, background: "var(--green)", transition: "width 0.3s" }} />
      <div style={{ width: `${dPct}%`, background: "var(--text3)", transition: "width 0.3s" }} />
      <div style={{ width: `${lPct}%`, background: "var(--red)", transition: "width 0.3s" }} />
    </div>
  );
}

export default function TabStats({ teamDetail }) {
  if (!teamDetail) return (
    <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>\u6682\u65e0\u6570\u636e</p>
  );

  const stats = teamDetail.totalStats;
  const topPlayers = teamDetail.topPlayers || [];
  const topScorers = [...topPlayers].sort((a, b) => b.goals - a.goals).slice(0, 10);

  const total = (stats?.w || 0) + (stats?.d || 0) + (stats?.l || 0);
  const wPct = total > 0 ? ((stats.w / total) * 100).toFixed(1) : 0;
  const dPct = total > 0 ? ((stats.d / total) * 100).toFixed(1) : 0;
  const lPct = total > 0 ? ((stats.l / total) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "12px 16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Total record card */}
      {stats && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px", background: "var(--card2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            \u603b\u6218\u7ee9
          </div>
          <div style={{ padding: "12px" }}>
            {/* Large stat numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, textAlign: "center", marginBottom: 12 }}>
              {[
                { value: stats.p, label: "\u573a\u6b21", color: "var(--text)" },
                { value: stats.gf, label: "\u8fdb\u7403", color: "var(--green)" },
                { value: stats.ga, label: "\u5931\u7403", color: "var(--red)" },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: item.color, fontVariantNumeric: "tabular-nums" }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* W/D/L horizontal bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <WDLBar w={stats.w} d={stats.d} l={stats.l} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              <span>
                <span style={{ color: "var(--green)", fontWeight: 700 }}>{stats.w}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 10 }}> \u80dc ({wPct}%)</span>
              </span>
              <span>
                <span style={{ color: "var(--text3)", fontWeight: 700 }}>{stats.d}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 10 }}> \u5e73 ({dPct}%)</span>
              </span>
              <span>
                <span style={{ color: "var(--red)", fontWeight: 700 }}>{stats.l}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 10 }}> \u8d1f ({lPct}%)</span>
              </span>
            </div>

            {/* Goal difference */}
            {stats.gd != null && (
              <div style={{
                marginTop: 10, textAlign: "center", fontSize: 12, color: "var(--text-dim)",
                padding: "6px 0", borderTop: "1px solid var(--border)",
              }}>
                \u51c0\u80dc\u7403 <span style={{ fontWeight: 800, color: stats.gd >= 0 ? "var(--green)" : "var(--red)", fontSize: 16 }}>
                  {stats.gd > 0 ? "+" : ""}{stats.gd}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discipline card */}
      {stats && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px", background: "var(--card2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            \u7eaa\u5f8b\u8bb0\u5f55
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--amber)", fontVariantNumeric: "tabular-nums" }}>
                {stats.yellow ?? 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                &#x1F7E1; \u9ec4\u724c
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: "14px 8px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--red)", fontVariantNumeric: "tabular-nums" }}>
                {stats.red ?? 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                &#x1F534; \u7ea2\u724c
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top scorers card */}
      {topScorers.length > 0 && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px", background: "var(--card2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            \u961f\u53f2\u5c04\u624b\u699c
          </div>
          {topScorers.map((player, idx) => (
            <div key={idx} style={{
              display: "flex", alignItems: "center", padding: "8px 12px", gap: 8,
              borderBottom: idx < topScorers.length - 1 ? "1px solid var(--border)" : "none",
              background: idx < 3 ? "rgba(92,158,255,0.04)" : "transparent",
            }}>
              <span style={{
                fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                color: idx === 0 ? "var(--amber)" : idx === 1 ? "var(--text2)" : idx === 2 ? "#cd7f32" : "var(--text-dim)",
                minWidth: 20, textAlign: "right",
              }}>
                {idx + 1}.
              </span>
              <span style={{ fontSize: 12, flex: 1, color: "var(--text)", fontWeight: idx < 3 ? 600 : 400 }}>
                {player.name}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "var(--blue)", fontVariantNumeric: "tabular-nums",
              }}>
                {player.goals}&#x26BD;
              </span>
              <span style={{ fontSize: 10, color: "var(--text-dim)", fontVariantNumeric: "tabular-nums", minWidth: 30, textAlign: "right" }}>
                {player.apps}\u573a
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
