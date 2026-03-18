export default function SectionTitle({ children, action, style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px 8px",
      ...style,
    }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
        {children}
      </h2>
      {action && (
        <span style={{ fontSize: 12, color: "var(--blue)" }}>{action}</span>
      )}
    </div>
  );
}
