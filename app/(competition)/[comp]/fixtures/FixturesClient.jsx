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
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function groupByDate(fixtures) {
  const map = new Map();
  for (const f of fixtures) {
    if (!f.startingAt) continue;
    const key = new Date(f.startingAt).toLocaleDateString(BJ_LOCALE, BJ_TZ);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }
  return map; // dateStr → fixtures[]
}

/** Build calendar grid for a month: array of weeks, each week has 7 day slots */
function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  // Monday=0 ... Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let week = new Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Single month calendar grid */
function MonthCalendar({ year, month, matchMap, selectedDate, onSelect, todayStr }) {
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const monthLabel = `${year}年${month + 1}月`;

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Month label */}
      <div style={{
        fontSize: 12, fontWeight: 800, color: "var(--text)",
        padding: "8px 0 6px", textAlign: "center",
        letterSpacing: "0.04em",
      }}>
        {monthLabel}
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{
            fontSize: 9, fontWeight: 700, color: "var(--text3)",
            textAlign: "center", padding: "2px 0",
          }}>{w}</div>
        ))}
      </div>

      {/* Day cells */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} />;
            const dateStr = toDateStr(year, month, day);
            const matches = matchMap.get(dateStr);
            const count = matches?.length || 0;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const hasLive = matches?.some(f => f.status === "LIVE");

            return (
              <button
                key={di}
                onClick={() => count > 0 && onSelect(dateStr)}
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "4px 0",
                  height: 44,
                  borderRadius: 8,
                  border: isSelected ? "1.5px solid var(--blue)"
                    : isToday ? "1px solid var(--text3)"
                    : "1px solid transparent",
                  background: isSelected ? "rgba(59,130,246,0.12)"
                    : count > 0 ? "var(--card)" : "transparent",
                  cursor: count > 0 ? "pointer" : "default",
                  opacity: count > 0 ? 1 : 0.3,
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? "var(--blue)" : isToday ? "var(--text)" : "var(--text2)",
                  lineHeight: 1,
                }}>
                  {day}
                </span>
                {count > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 2, marginTop: 3,
                  }}>
                    {hasLive && (
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "var(--live)",
                        animation: "pulse 1.5s infinite",
                        flexShrink: 0,
                      }} />
                    )}
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      color: hasLive ? "var(--live)" : isSelected ? "var(--blue)" : "var(--text3)",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {count}场
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const FIXTURES_DATE_KEY = "djyy_fixtures_date";

export default function FixturesClient() {
  const { comp } = useParams();
  const [selectedDate, setSelectedDate] = useState(() => {
    try { return sessionStorage.getItem(FIXTURES_DATE_KEY); } catch { return null; }
  });
  const { data: fixturesData, loading } = useFixtures({ pollInterval: 30000 });
  const { data: predData } = usePredictions();
  const matchListRef = useRef(null);

  const matchMap = useMemo(() => groupByDate(fixturesData?.fixtures || []), [fixturesData]);

  const todayStr = new Date().toLocaleDateString(BJ_LOCALE, BJ_TZ);

  // Persist selected date to sessionStorage
  useEffect(() => {
    try {
      if (selectedDate) sessionStorage.setItem(FIXTURES_DATE_KEY, selectedDate);
    } catch {}
  }, [selectedDate]);

  // Auto-select: today if has matches, else first match day
  const autoDate = useMemo(() => {
    if (matchMap.has(todayStr)) return todayStr;
    const sorted = [...matchMap.keys()].sort();
    // Find nearest future date, or first date
    const future = sorted.find(d => d >= todayStr);
    return future || sorted[0] || null;
  }, [matchMap, todayStr]);

  const activeDate = selectedDate || autoDate;
  const activeFixtures = activeDate ? matchMap.get(activeDate) || [] : [];
  const predictions = predData?.teams || [];

  // Scroll to match list when date is selected
  useEffect(() => {
    if (selectedDate && matchListRef.current) {
      matchListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

      {/* Calendar section */}
      <div style={{
        padding: "4px 12px 8px",
        background: "var(--bg)",
      }}>
        <MonthCalendar
          year={2026} month={5} // June (0-indexed)
          matchMap={matchMap}
          selectedDate={activeDate}
          onSelect={setSelectedDate}
          todayStr={todayStr}
        />
        <MonthCalendar
          year={2026} month={6} // July
          matchMap={matchMap}
          selectedDate={activeDate}
          onSelect={setSelectedDate}
          todayStr={todayStr}
        />
      </div>

      {/* Match list for selected date */}
      <div ref={matchListRef} style={{ paddingBottom: 80 }}>
        {activeDate && activeFixtures.length > 0 ? (
          <>
            {activeFixtures.map(f => (
              <MatchCard
                key={f.id}
                fixture={f}
                predictions={predictions}
                showVenue
              />
            ))}
          </>
        ) : activeDate ? (
          <p style={{ padding: "24px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
            该日无比赛
          </p>
        ) : null}
      </div>
    </div>
  );
}
