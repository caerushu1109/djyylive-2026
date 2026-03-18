"use client";
export default function EloSparkline({ data, width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => (typeof d === "number" ? d : d.elo));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const current = values[values.length - 1];
  const prev = values[values.length - 2];
  const trend = current > prev ? "var(--green)" : current < prev ? "var(--red)" : "var(--blue)";

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={trend}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
