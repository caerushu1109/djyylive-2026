"use client";

export default function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: "var(--text3)",
      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
    }}>
      {children}
    </div>
  );
}
