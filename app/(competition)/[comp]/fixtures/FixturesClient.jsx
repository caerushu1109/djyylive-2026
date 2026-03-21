"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { usePredictions } from "@/lib/hooks/usePredictions";
import TopBar from "@/components/shared/TopBar";
import MatchCard from "@/components/shared/MatchCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const BJ_LOCALE = "en-CA";
const BJ_TZ = { timeZone: "Asia/Shanghai" };

function formatDateLabel(dateStr) {
  const todayBJT = new Date().toLocaleDateString(BJ_LOCALE, BJ_TZ);
  const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
  const tomorrowBJT = tmr.toLocaleDateString(BJ_LOCALE, BJ_TZ);
  if (dateStr === todayBJT) return "今天";
  if (dateStr === tomorrowBJT) return "明天";
  const d = new Date(dateStr + "T12:00:00+08:00");
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", weekday: "short" }).format(d);
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00+08:00");
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(d);
}

function groupByDate(fixtures) {
  const map = new Map();
  for (const f of fixtures) {
    if (!f.startingAt) continue;
    const key = new Date(f.startingAt).toLocaleDateString(BJ_LOCALE, BJ_TZ);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/** Day summary header */
function DaySummary({ dateStr, fixtures }) {
  const groups = [...new Set(fixtures.map(f => f.group).filter(Boolean))];
  const venues = [...new Set(fixtures.map(f => f.venue).filter(Boolean))];
  const liveCount = fixtures.filter(f => f.status === "LIVE").length;
  const ftCount = fixtures.filter(f => f.status === "FT").length;
  const nsCount = fixtures.filter(f => f.status === "NS").length;

  return (
    <div style={{
      margin: "0 12px 8px", padding: "10px 12px",
      background: "linear-gradient(135deg, var(--card), var(--card2))",
      border: "1px solid var(--border)", borderRadius: "var(--radius)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
          {formatFullDate(dateStr)}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: "var(--blue)",
          background: "rgba(59,130,246,0.1)", padding: "2px 8px", borderRadius: 4,
        }}>
          {fixtures.length}场比赛
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
        {groups.length > 0 && (
          <span style={{ fontSize: 10, color: "var(--text3)" }}>
            {groups.join(" · ")}
          </span>
        )}
        {liveCount > 0 && (
          <span style={{ fontSize: 10, color: "var(--live)", fontWeight: 700 }}>
            🔴 {liveCount}场进行中
          </span>
        )}
        {ftCount > 0 && nsCount > 0 && (
          <span style={{ fontSize: 10, color: "var(--text3)" }}>
            ✅ {ftCount}场已结束 · ⏳ {nsCount}场未开始
          </span>
        )}
      </div>
      {venues.length > 0 && (
        <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 4 }}>
          📍 {venues.join(" · ")}
        </div>
      )}
    </div>
  );
}

export default function FixturesClient() {
  const { comp } = useParams();
  const [activeDate, setActiveDate] = useState(null);
  const { data: fixturesData, loading } = useFixtures({ pollInterval: 30000 });
  const { data: predData } = usePredictions();
  const tabsRef = useRef(null);

  const dateGroups = useMemo(() => groupByDate(fixturesData?.fixtures || []), [fixturesData]);
  const tabs = useMemo(() => dateGroups.map(([date]) => ({ id: date, label: formatDateLabel(date) })), [dateGroups]);
  const selectedDate = activeDate || tabs[0]?.id;

  // Show up to 3 consecutive days when a day has few matches
  const visibleDays = useMemo(() => {
    const idx = dateGroups.findIndex(([date]) => date === selectedDate);
    if (idx === -1) return [];
    const primary = dateGroups[idx];
    const primaryCount = primary[1].length;
    // If primary day has ≤4 matches, show next day(s) too
    if (primaryCount <= 4 && idx + 1 < dateGroups.length) {
      const result = [primary];
      let totalMatches = primaryCount;
      for (let i = idx + 1; i < dateGroups.length && result.length < 3; i++) {
        const next = dateGroups[i];
        if (totalMatches + next[1].length > 10) break; // cap at ~10 matches
        result.push(next);
        totalMatches += next[1].length;
      }
      return result;
    }
    return [primary];
  }, [dateGroups, selectedDate]);

  const predictions = predData?.teams || [];

  // Set of all visible date strings for tab highlighting
  const visibleDateSet = useMemo(
    () => new Set(visibleDays.map(([d]) => d)),
    [visibleDays]
  );

  // Scroll active tab into view
  useEffect(() => {
    if (!tabsRef.current || !selectedDate) return;
    const btn = tabsRef.current.querySelector(`[data-date="${selectedDate}"]`);
    if (btn) btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDate]);

  if (loading) return (
    <div>
      <TopBar comp={comp} label="赛程" />
      <LoadingSpinner />
    </div>
  );

  return (
    <div>
      <TopBar comp={comp} label="赛程" />

      {/* Date tabs */}
      <div ref={tabsRef} style={{
        display: "flex", overflowX: "auto", padding: "0 12px", gap: 2,
        flexShrink: 0, borderBottom: "1px solid var(--border)",
        background: "var(--bg)", position: "sticky", top: 52, zIndex: 40,
        scrollbarWidth: "none",
      }}>
        {tabs.map(t => {
          const isPrimary = t.id === selectedDate;
          const isVisible = visibleDateSet.has(t.id);
          return (
            <button
              key={t.id}
              data-date={t.id}
              onClick={() => setActiveDate(t.id)}
              style={{
                padding: "10px 12px", fontSize: 11, fontWeight: 700,
                color: isPrimary ? "var(--blue)" : isVisible ? "var(--blue)" : "var(--text3)",
                opacity: isVisible && !isPrimary ? 0.6 : 1,
                borderBottom: isPrimary ? "2px solid var(--blue)"
                  : isVisible ? "2px solid rgba(59,130,246,0.3)"
                  : "2px solid transparent",
                whiteSpace: "nowrap", background: "none", border: "none", cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ paddingBottom: 80, paddingTop: 8 }}>
        {visibleDays.length === 0 ? (
          <p style={{ padding: "24px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>该日期暂无比赛</p>
        ) : (
          visibleDays.map(([dateStr, fixtures], dayIdx) => (
            <div key={dateStr}>
              {/* Day summary card */}
              <DaySummary dateStr={dateStr} fixtures={fixtures} />

              {/* Match cards */}
              {fixtures.map(f => (
                <MatchCard
                  key={f.id}
                  fixture={f}
                  predictions={predictions}
                  showVenue
                />
              ))}

              {/* Separator between days */}
              {dayIdx < visibleDays.length - 1 && (
                <div style={{
                  margin: "8px 12px 12px", height: 1,
                  background: "var(--border)",
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
