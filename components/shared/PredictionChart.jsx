export default function PredictionChart({ teams, showElo = true }) {
  if (!teams || teams.length === 0) return null;

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden",
    }}>
      {teams.map((team, i) => (
        <div key={team.name || i} style={{
          padding: "10px 14px",
          borderBottom: i < teams.length - 1 ? "1px solid var(--border)" : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              width: 24, fontSize: 11,
              color: i < 3 ? "var(--gold)" : "var(--text-dim)",
              fontWeight: 600, textAlign: "right",
            }}>{team.rank || i + 1}</span>
            <span style={{ fontSize: 20 }}>{team.flag}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: i < 3 ? 600 : 400 }}>{team.name}</span>
            {showElo && (
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                {team.elo}
              </span>
            )}
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: i === 0 ? "var(--gold)" : i < 3 ? "var(--blue)" : "var(--text)",
              minWidth: 48, textAlign: "right",
            }}>
              {team.titleProbability}
            </span>
          </div>
          <div style={{ marginLeft: 32, height: 4, background: "var(--border)", borderRadius: 2 }}>
            <div style={{
              height: "100%",
              width: `${team.width || 0}%`,
              background: i === 0
                ? "linear-gradient(90deg, var(--gold), #ffdd57)"
                : i < 3 ? "var(--blue)" : "rgba(92,158,255,0.5)",
              borderRadius: 2,
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
