"use client";
import { useState } from "react";
import GroupTable from "./GroupTable";

/**
 * GroupSimulator wraps GroupTable with an optional live/simulate mode toggle.
 *
 * Props:
 *   standings   – array from useFixtures / useStandings, one entry per group
 *   interactive – when true, show the live ↔ simulate toggle button
 *   activeGroup – if provided, filter to show only this group letter (e.g. "A 组")
 */
export default function GroupSimulator({ standings, interactive = false, activeGroup = null }) {
  const [simMode, setSimMode] = useState(false);

  if (!standings || standings.length === 0) {
    return (
      <div style={{ padding: "24px 16px", color: "var(--text-dim)", fontSize: 14 }}>
        积分数据加载中...
      </div>
    );
  }

  const visible = activeGroup
    ? standings.filter((g) => g.group === activeGroup)
    : standings;

  return (
    <div>
      {/* Mode toggle banner */}
      {interactive ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          margin: "8px 12px 12px",
          padding: "8px 12px",
          background: simMode ? "rgba(255,193,7,0.08)" : "rgba(92,158,255,0.08)",
          border: `1px solid ${simMode ? "rgba(255,193,7,0.2)" : "rgba(92,158,255,0.2)"}`,
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
            {simMode ? "🧪 模拟模式 — 编辑赛果" : "📊 实时数据 — 每日同步"}
          </span>
          <button
            onClick={() => setSimMode((m) => !m)}
            style={{
              fontSize: 11, fontWeight: 700,
              background: simMode ? "var(--gold-dim)" : "var(--blue-dim)",
              border: `1px solid ${simMode ? "rgba(255,193,7,0.3)" : "rgba(92,158,255,0.3)"}`,
              color: simMode ? "var(--gold)" : "var(--blue)",
              borderRadius: 6, padding: "3px 10px", cursor: "pointer",
            }}
          >
            {simMode ? "返回实时" : "模拟"}
          </button>
        </div>
      ) : (
        <div style={{
          margin: "8px 12px 12px", padding: "8px 12px",
          background: "rgba(92,158,255,0.08)", border: "1px solid rgba(92,158,255,0.2)",
          borderRadius: 8, fontSize: 12, color: "var(--text-dim)",
        }}>
          💡 当前积分榜数据，赛季进行时更新
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 12px 12px" }}>
        {visible.map((group) => (
          <GroupTable key={group.group} group={group} />
        ))}
      </div>
    </div>
  );
}
