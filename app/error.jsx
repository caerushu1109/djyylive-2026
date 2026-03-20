"use client";

export default function ErrorPage({ error, reset }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", padding: "24px 16px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
        出了点问题
      </h2>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, maxWidth: 300 }}>
        {error?.message || "页面加载失败，请稍后重试"}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "10px 24px", fontSize: 13, fontWeight: 700,
          background: "var(--blue)", color: "#fff", border: "none",
          borderRadius: 8, cursor: "pointer",
        }}
      >
        重新加载
      </button>
    </div>
  );
}
