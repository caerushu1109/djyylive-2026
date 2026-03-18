const TONE_COLORS = {
  live:    { bg: "rgba(255,61,61,0.15)",  text: "var(--live)",   border: "rgba(255,61,61,0.3)" },
  ft:      { bg: "rgba(138,146,160,0.1)", text: "var(--text-dim)", border: "var(--border)" },
  ns:      { bg: "rgba(92,158,255,0.1)",  text: "var(--blue)",   border: "rgba(92,158,255,0.2)" },
  green:   { bg: "rgba(0,230,118,0.12)",  text: "var(--green)",  border: "rgba(0,230,118,0.25)" },
  gold:    { bg: "rgba(255,193,7,0.12)",  text: "var(--gold)",   border: "rgba(255,193,7,0.25)" },
  default: { bg: "rgba(138,146,160,0.1)", text: "var(--text-dim)", border: "var(--border)" },
};

export default function Badge({ children, tone = "default", style }) {
  const colors = TONE_COLORS[tone] || TONE_COLORS.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
      background: colors.bg, color: colors.text,
      border: `1px solid ${colors.border}`,
      ...style,
    }}>
      {children}
    </span>
  );
}
