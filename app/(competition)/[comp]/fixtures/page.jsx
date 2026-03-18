"use client";
import { useState, useMemo } from "react";
import { useFixtures } from "@/lib/hooks/useFixtures";
import MatchCard from "@/components/shared/MatchCard";
import TabBar from "@/components/ui/TabBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "今天";
  if (d.toDateString() === tomorrow.toDateString()) return "明天";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", weekday: "short" }).format(d);
}

function groupByDate(fixtures) {
  const map = new Map();
  for (const f of fixtures) {
    if (!f.startingAt) continue;
    const key = f.startingAt.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function FixturesPage() {
  const { data, loading } = useFixtures();
  const [activeDate, setActiveDate] = useState(null);

  const dateGroups = useMemo(() => groupByDate(data?.fixtures || []), [data]);

  const tabs = useMemo(() => dateGroups.map(([date]) => ({
    id: date,
    label: formatDateLabel(date),
  })), [dateGroups]);

  const selectedDate = activeDate || tabs[0]?.id;

  const visibleFixtures = useMemo(() => {
    const group = dateGroups.find(([date]) => date === selectedDate);
    return group ? group[1] : [];
  }, [dateGroups, selectedDate]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <CalendarDays size={18} style={{ color: "var(--blue)", marginRight: 8 }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>赛程</span>
      </div>

      <div style={{
        position: "sticky", top: "var(--topbar-h)", zIndex: 40,
        background: "var(--bg)", borderBottom: "1px solid var(--border)",
        padding: "8px 0",
      }}>
        <TabBar tabs={tabs} active={selectedDate} onChange={setActiveDate} />
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {visibleFixtures.length === 0 ? (
          <EmptyState icon="📅" title="该日期暂无比赛" />
        ) : (
          visibleFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)
        )}
      </div>
    </div>
  );
}
