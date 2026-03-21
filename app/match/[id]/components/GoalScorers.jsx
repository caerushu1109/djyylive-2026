"use client";

export default function GoalScorers({ events, fixture, onPlayerClick }) {
  const goals = (events || []).filter((e) => e.type?.includes("goal"));
  if (!goals.length) return null;
  const homeGoals = goals.filter((e) => e.team === fixture.home.originalName);
  const awayGoals = goals.filter((e) => e.team === fixture.away.originalName);
  return (
    <div style={{
      display: "flex", padding: "6px 16px 2px", gap: 16, justifyContent: "space-between",
    }}>
      <div style={{ flex: 1, textAlign: "left" }}>
        {homeGoals.map((g, i) => (
          <div key={i} style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.6 }}>
            &#x26BD; <span onClick={() => onPlayerClick?.(g.title)} style={{ cursor: "pointer" }}>{g.title}</span> {g.minute}&apos;
          </div>
        ))}
      </div>
      <div style={{ flex: 1, textAlign: "right" }}>
        {awayGoals.map((g, i) => (
          <div key={i} style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.6 }}>
            <span onClick={() => onPlayerClick?.(g.title)} style={{ cursor: "pointer" }}>{g.title}</span> {g.minute}&apos; &#x26BD;
          </div>
        ))}
      </div>
    </div>
  );
}
