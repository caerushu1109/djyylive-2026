import Link from "next/link";

export default function TopBar({ comp, badge, label, right }) {
  return (
    <div style={{
      padding: "10px 16px 8px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href={`/${comp}`} style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
          DJ<span style={{ color: "var(--blue)" }}>YY</span>
        </Link>
        {badge && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "var(--card)", border: "1px solid var(--border2)",
            borderRadius: 999, padding: "3px 10px 3px 7px",
          }}>
            <span style={{ fontSize: 10, letterSpacing: 1 }}>🏆</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>2026</span>
            <span style={{ fontSize: 9, letterSpacing: 1 }}>🇺🇸🇲🇽🇨🇦</span>
          </div>
        )}
        {label && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>{label}</span>}
      </div>
      {right && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {right}
        </div>
      )}
    </div>
  );
}
