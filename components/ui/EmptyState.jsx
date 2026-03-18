export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 24px", gap: 10,
    }}>
      {icon && <div style={{ fontSize: 36, opacity: 0.4 }}>{icon}</div>}
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-dim)" }}>{title}</p>
      {subtitle && <p style={{ margin: 0, fontSize: 13, color: "var(--text-dim)", opacity: 0.6 }}>{subtitle}</p>}
    </div>
  );
}
