import { Activity, Clock } from "lucide-react";

export default function MarketsPage() {
  return (
    <div>
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Activity size={18} style={{ color: "var(--purple)", marginRight: 8 }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>市场赔率</span>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 24px", gap: 16, textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(179,136,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Clock size={28} style={{ color: "var(--purple)" }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>市场对比即将上线</h2>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
            Polymarket 夺冠市场、博彩公司赔率聚合、<br />
            模型 vs 市场价值发现信号 — Phase 2 开发中。
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {["Polymarket", "SportMonks Odds", "价值发现"].map((tag) => (
            <span key={tag} style={{
              padding: "4px 10px", borderRadius: 8,
              background: "rgba(179,136,255,0.1)",
              border: "1px solid rgba(179,136,255,0.2)",
              fontSize: 12, color: "var(--purple)",
            }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
