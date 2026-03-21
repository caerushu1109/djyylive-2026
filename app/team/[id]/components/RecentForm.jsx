"use client";

function formBadge(fixture, teamOriginalName) {
  const { home, away, score } = fixture;
  if (!score || score.home == null || score.away == null) return null;
  const isHome = home.originalName === teamOriginalName || home.name === teamOriginalName;
  const teamScore = isHome ? score.home : score.away;
  const oppScore  = isHome ? score.away : score.home;
  if (teamScore > oppScore) return "W";
  if (teamScore < oppScore) return "L";
  return "D";
}

const FORM_COLOR = {
  W: { bg: "var(--green, #22c55e)", text: "#fff" },
  D: { bg: "var(--text3, #6b7280)", text: "#fff" },
  L: { bg: "var(--red, #ef4444)",   text: "#fff" },
};

export default function FormStrip({ fixtures, teamOriginalName }) {
  const finished = fixtures
    .filter((f) => f.status === "FT" || f.status === "AET" || f.status === "PEN")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .reverse();
  if (finished.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
      {finished.map((f, i) => {
        const result = formBadge(f, teamOriginalName);
        if (!result) return null;
        const { bg, text } = FORM_COLOR[result];
        return (
          <div
            key={f.id || i}
            title={`${f.home.name} ${f.score?.home}-${f.score?.away} ${f.away.name}`}
            style={{
              width: 22, height: 22, borderRadius: 4,
              background: bg, color: text,
              fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {result}
          </div>
        );
      })}
    </div>
  );
}
