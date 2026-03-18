"use client";
import { useState } from "react";
import { useFixtures } from "@/lib/hooks/useFixtures";
import GroupTable from "@/components/wc/GroupTable";
import GroupSimulator from "@/components/wc/GroupSimulator";
import TabBar from "@/components/ui/TabBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { BarChart3 } from "lucide-react";

const GROUP_TABS = [
  { id: "standings", label: "积分榜" },
  { id: "simulator", label: "出线模拟" },
];

export default function GroupsPage() {
  const [tab, setTab] = useState("standings");
  const { data, loading } = useFixtures();
  const standings = data?.standings || [];

  return (
    <div>
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <BarChart3 size={18} style={{ color: "var(--blue)", marginRight: 8 }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>小组积分</span>
      </div>

      <div style={{
        position: "sticky", top: "var(--topbar-h)", zIndex: 40,
        background: "var(--bg)", borderBottom: "1px solid var(--border)",
        padding: "8px 0",
      }}>
        <TabBar tabs={GROUP_TABS} active={tab} onChange={setTab} />
      </div>

      <div style={{ paddingBottom: 16 }}>
        {loading ? (
          <LoadingSpinner />
        ) : tab === "standings" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px" }}>
            {standings.map((group) => (
              <GroupTable key={group.group} group={group} />
            ))}
          </div>
        ) : (
          <GroupSimulator standings={standings} fixtures={data?.fixtures} />
        )}
      </div>
    </div>
  );
}
