import Link from "next/link";

export default function TopBar({ comp, badge, label, onSearchClick, right }) {
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
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--card)", border: "1px solid var(--border2)",
            borderRadius: 999, padding: "3px 10px 3px 6px",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>2026 WC</span>
            <span style={{ fontSize: 8, color: "var(--text3)" }}>&#9662;</span>
          </div>
        )}
        {label && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>{label}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        {onSearchClick && (
          <div onClick={onSearchClick} style={{
            width: 32, height: 32, background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, cursor: "pointer",
          }}>&#128269;</div>
        )}
      </div>
    </div>
  );
}
