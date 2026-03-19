"use client";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFixtures } from "@/lib/hooks/useFixtures";
import MatchCard from "@/components/shared/MatchCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// 以北京时间为准的今天/明天判断
const BJ_LOCALE = "en-CA"; // 返回 YYYY-MM-DD 格式
const BJ_TZ = { timeZone: "Asia/Shanghai" };

function formatDateLabel(dateStr) {
  // dateStr 是北京时间日期 "YYYY-MM-DD"
  const todayBJT   = new Date().toLocaleDateString(BJ_LOCALE, BJ_TZ);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowBJT = tomorrowDate.toLocaleDateString(BJ_LOCALE, BJ_TZ);

  if (dateStr === todayBJT) return "今天";
  if (dateStr === tomorrowBJT) return "明天";

  // 格式化显示：月/日 + 星期
  const d = new Date(dateStr + "T12:00:00+08:00"); // 用北京中午时间避免跨日
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", weekday: "short" }).format(d);
}

function groupByDate(fixtures) {
  const map = new Map();
  for (const f of fixtures) {
    if (!f.startingAt) continue;
    // 用北京时间日期作为分组 key
    const key = new Date(f.startingAt).toLocaleDateString(BJ_LOCALE, BJ_TZ);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function FixturesPage() {
  const { comp } = useParams();
  const { data, loading } = useFixtures();
  const [activeDate, setActiveDate] = useState(null);

  const dateGroups = useMemo(() => groupByDate(data?.fixtures || []), [data]);
  const tabs = useMemo(() => dateGroups.map(([date]) => ({ id: date, label: formatDateLabel(date) })), [dateGroups]);
  const selectedDate = activeDate || tabs[0]?.id;
  const visibleFixtures = useMemo(() => {
    const group = dateGroups.find(([date]) => date === selectedDate);
    return group ? group[1] : [];
  }, [dateGroups, selectedDate]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      {/* TopBar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px 8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={`/${comp}`} style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
            DJ<span style={{ color: "var(--blue)" }}>YY</span>
          </Link>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>赛程</span>
        </div>
      </div>

      {/* Date tabs */}
      <div style={{
        display: "flex",
        overflowX: "auto",
        padding: "0 12px",
        gap: 2,
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        position: "sticky",
        top: 52,
        zIndex: 40,
        scrollbarWidth: "none",
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveDate(t.id)}
            style={{
              padding: "10px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: t.id === selectedDate ? "var(--blue)" : "var(--text3)",
              borderBottom: t.id === selectedDate ? "2px solid var(--blue)" : "2px solid transparent",
              whiteSpace: "nowrap",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ paddingBottom: 80, paddingTop: 8 }}>
        {visibleFixtures.length === 0 ? (
          <p style={{ padding: "24px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>该日期暂无比赛</p>
        ) : (
          visibleFixtures.map(f => <MatchCard key={f.id} fixture={f} />)
        )}
      </div>
    </div>
  );
}
