import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", padding: "24px 16px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
        页面未找到
      </h2>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
        你访问的页面不存在
      </p>
      <Link href="/wc2026" style={{
        padding: "10px 24px", fontSize: 13, fontWeight: 700,
        background: "var(--blue)", color: "#fff", borderRadius: 8,
        textDecoration: "none",
      }}>
        返回首页
      </Link>
    </div>
  );
}
