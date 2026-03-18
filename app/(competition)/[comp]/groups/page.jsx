"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useFixtures } from "@/lib/hooks/useFixtures";
import GroupTable from "@/components/wc/GroupTable";
import GroupSimulator from "@/components/wc/GroupSimulator";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const SUB_TABS = ["积分榜", "模拟器", "淘汰赛"];

export default function GroupsPage() {
  const { comp } = useParams();
  const [subTab, setSubTab] = useState("积分榜");
  const [activeGroup, setActiveGroup] = useState(null);
  const { data, loading } = useFixtures();
  const standings = data?.standings || [];

  const groups = standings.map(g => g.group);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* TopBar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px 8px",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
          DJ<span style={{ color: "var(--blue)" }}>YY</span>
        </span>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "var(--card)",
          border: "1px solid var(--border2)",
          borderRadius: 999,
          padding: "3px 10px 3px 6px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>2026 WC</span>
          <span style={{ fontSize: 8, color: "var(--text3)" }}>▾</span>
        </div>
        <div style={{
          width: 32,
          height: 32,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}>🔍</div>
      </div>

      {/* Group letter tabs */}
      <div style={{
        display: "flex",
        overflowX: "auto",
        padding: "8px 12px 0",
        gap: 6,
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        scrollbarWidth: "none",
      }}>
        <button
          onClick={() => setActiveGroup(null)}
          style={{
            padding: "5px 10px 8px",
            fontSize: 11,
            fontWeight: 800,
            color: activeGroup === null ? "var(--blue)" : "var(--text3)",
            borderBottom: activeGroup === null ? "2px solid var(--blue)" : "2px solid transparent",
            whiteSpace: "nowrap",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          全部
        </button>
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            style={{
              padding: "5px 10px 8px",
              fontSize: 11,
              fontWeight: 800,
              color: activeGroup === g ? "var(--blue)" : "var(--text3)",
              borderBottom: activeGroup === g ? "2px solid var(--blue)" : "2px solid transparent",
              whiteSpace: "nowrap",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Sub tabs */}
      <div style={{
        display: "flex",
        padding: "0 12px",
        gap: 4,
        flexShrink: 0,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}>
        {SUB_TABS.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "9px 0",
              fontSize: 10,
              fontWeight: 700,
              color: subTab === t ? "var(--blue)" : "var(--text3)",
              borderBottom: subTab === t ? "2px solid var(--blue)" : "2px solid transparent",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ paddingBottom: 16, overflowY: "auto" }}>
        {loading ? (
          <LoadingSpinner />
        ) : subTab === "积分榜" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 12px" }}>
            {(activeGroup
              ? standings.filter(g => g.group === activeGroup)
              : standings
            ).map(group => (
              <GroupTable key={group.group} group={group} />
            ))}
          </div>
        ) : subTab === "模拟器" ? (
          <GroupSimulator standings={standings} fixtures={data?.fixtures} />
        ) : (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
            淘汰赛对阵图将在小组赛结束后显示
          </div>
        )}
      </div>
    </div>
  );
}
