"use client";
export default function TabBar({ tabs, active, onChange, style }) {
  return (
    <div style={{
      display: "flex",
      overflowX: "auto",
      gap: 4,
      padding: "0 16px",
      scrollbarWidth: "none",
      ...style,
    }}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 8,
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              background: isActive ? "rgba(92,158,255,0.15)" : "transparent",
              color: isActive ? "var(--blue)" : "var(--text-dim)",
              border: isActive ? "1px solid rgba(92,158,255,0.3)" : "1px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
