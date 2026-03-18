"use client";
import GroupTable from "./GroupTable";

export default function GroupSimulator({ standings }) {
  if (!standings || standings.length === 0) {
    return (
      <div style={{ padding: "24px 16px", color: "var(--text-dim)", fontSize: 14 }}>
        积分数据加载中...
      </div>
    );
  }
  return (
    <div>
      <div style={{
        margin: "8px 16px 12px",
        padding: "8px 12px",
        background: "rgba(92,158,255,0.08)",
        border: "1px solid rgba(92,158,255,0.2)",
        borderRadius: 8,
        fontSize: 12, color: "var(--text-dim)",
      }}>
        💡 当前积分榜数据，赛季进行时更新
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
        {standings.map((group) => (
          <GroupTable key={group.group} group={group} />
        ))}
      </div>
    </div>
  );
}
