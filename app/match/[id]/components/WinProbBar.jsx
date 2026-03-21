"use client";

export default function WinProbBar({ predictions, fixture }) {
  if (!predictions || predictions.home_win == null) return null;
  const h = predictions.home_win;
  const d = predictions.draw;
  const a = predictions.away_win;
  return (
    <div style={{
      background: "var(--card)", borderRadius: 10, padding: "10px 14px",
      border: "1px solid var(--border)",
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: "var(--text3)",
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
      }}>
        AI \u80dc\u7387\u9884\u6d4b
      </div>
      <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ flex: h, background: "var(--blue)", borderRadius: "6px 0 0 6px" }} />
        <div style={{ flex: d, background: "var(--text3)" }} />
        <div style={{ flex: a, background: "var(--red)", borderRadius: "0 6px 6px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--blue)" }}>{h}%</div>
          <div style={{ fontSize: 9, color: "var(--text3)" }}>{fixture.home.name}\u80dc</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text3)" }}>{d}%</div>
          <div style={{ fontSize: 9, color: "var(--text3)" }}>\u5e73\u5c40</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--red)" }}>{a}%</div>
          <div style={{ fontSize: 9, color: "var(--text3)" }}>{fixture.away.name}\u80dc</div>
        </div>
      </div>
      {(predictions.btts_yes || predictions.over_2_5 || predictions.correct_score) && (
        <div style={{
          display: "flex", gap: 8, marginTop: 10, paddingTop: 8,
          borderTop: "1px solid var(--border)",
        }}>
          {predictions.correct_score && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{predictions.correct_score}</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>\u9884\u6d4b\u6bd4\u5206</div>
            </div>
          )}
          {predictions.over_2_5 != null && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{predictions.over_2_5}%</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>\u59272.5\u7403</div>
            </div>
          )}
          {predictions.btts_yes != null && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{predictions.btts_yes}%</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>\u53cc\u65b9\u8fdb\u7403</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
