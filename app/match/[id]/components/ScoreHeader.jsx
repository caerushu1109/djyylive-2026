"use client";

export default function ScoreHeader({ fixture, onBack, onTeamClick }) {
  return (
    <div style={{ background: "linear-gradient(180deg, #151825 0%, #0e1018 100%)" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", padding: "10px 12px 0", gap: 10,
      }}>
        <button onClick={onBack} style={{
          fontSize: 20, color: "var(--text2)", padding: "2px 6px",
          background: "none", border: "none", cursor: "pointer", lineHeight: 1,
        }}>&#x2039;</button>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>
          {fixture.stage || "2026 \u4e16\u754c\u676f"}
        </span>
        {fixture.status === "LIVE" && (
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,61,61,0.12)", border: "1px solid rgba(255,61,61,0.3)",
            borderRadius: 6, padding: "3px 8px",
          }}>
            <span style={{
              width: 6, height: 6, background: "var(--live)", borderRadius: "50%",
              animation: "pulse 1.5s infinite", display: "inline-block",
            }} />
            <span style={{ fontSize: 10, color: "var(--live)", fontWeight: 800 }}>
              LIVE {fixture.minute}
            </span>
          </div>
        )}
      </div>

      {/* Score area */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 14px", gap: 6 }}>
        {/* Home */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>{fixture.home.flag}</span>
          <span onClick={() => onTeamClick?.(fixture.home)} style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", textAlign: "center", lineHeight: 1.3, cursor: "pointer" }}>
            {fixture.home.name}
          </span>
        </div>

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, minWidth: 90 }}>
          {fixture.status !== "NS" ? (
            <div style={{
              fontSize: 42, fontWeight: 900, color: "var(--text)",
              letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
            }}>
              {fixture.homeScore ?? 0}<span style={{ color: "var(--text3)", margin: "0 2px" }}>-</span>{fixture.awayScore ?? 0}
            </div>
          ) : (
            <div style={{ fontSize: 24, fontWeight: 300, color: "var(--text2)" }}>VS</div>
          )}
          {fixture.status === "LIVE" && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: "var(--live)",
              background: "rgba(255,61,61,0.12)", padding: "2px 10px",
              borderRadius: 4, marginTop: 4,
            }}>
              {fixture.minute}
            </div>
          )}
          {fixture.status === "FT" && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: "var(--text3)",
              background: "var(--card2)", padding: "2px 10px",
              borderRadius: 4, marginTop: 4,
            }}>
              \u5168\u573a\u7ed3\u675f
            </div>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>{fixture.away.flag}</span>
          <span onClick={() => onTeamClick?.(fixture.away)} style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", textAlign: "center", lineHeight: 1.3, cursor: "pointer" }}>
            {fixture.away.name}
          </span>
        </div>
      </div>

      {/* Venue */}
      {fixture.venue && (
        <div style={{ textAlign: "center", fontSize: 10, color: "var(--text3)", paddingBottom: 10 }}>
          \ud83d\udccd {fixture.venue}
        </div>
      )}
    </div>
  );
}
