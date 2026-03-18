"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Home,
  Calendar,
  BarChart2,
  Target,
  BookOpen,
  Search,
  ChevronLeft,
  Share2,
  Heart,
  Trophy,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  detailTabs,
  groupLegend,
  homeFixtures,
  eloMethodNote,
  eloRankings,
  eventTimeline,
  groupedFixtures,
  h2hMatches,
  h2hSummary,
  historyTournaments,
  liveStats,
  predictions,
  simulatorFallbackNote,
  simulatorScenarios,
  standings,
  statGrid,
} from "@/src/mock/worldcup-data";
import { normalizeTeamDisplay } from "@/src/lib/team-meta";

// ─── Nav items with Lucide icons ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home",     Icon: Home,      label: "首页" },
  { id: "fixtures", Icon: Calendar,  label: "赛程" },
  { id: "groups",   Icon: BarChart2, label: "积分" },
  { id: "predict",  Icon: Target,    label: "预测" },
  { id: "history",  Icon: BookOpen,  label: "历史" },
];

const DATA_MODES = {
  LIVE: "live",
  DRILL: "drill",
};

// ─── 2026 World Cup opening day (UTC) ────────────────────────────────────────
const WC_OPENING = new Date("2026-06-11T18:00:00Z");

// ─── Helper functions ─────────────────────────────────────────────────────────

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function normalizeTeamList(teams) {
  return (teams || []).map((team) => normalizeTeamDisplay(team));
}

function normalizeTrendTeams(teams) {
  return (teams || []).map((team) => normalizeTeamDisplay(team));
}

function normalizeHistoryTeams(teams) {
  return (teams || []).map((team) => normalizeTeamDisplay(team));
}

function formatDateKey(value) {
  return String(value || "").slice(0, 10);
}

function getTodayDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}

function getTomorrowDateKey() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(now);
}

function selectHomeFixtures(fixtures) {
  const today = getTodayDateKey();
  const liveFixtures = fixtures.filter((fixture) => fixture.status === "LIVE");
  if (liveFixtures.length) {
    const liveDates = new Set(liveFixtures.map((fixture) => formatDateKey(fixture.startingAt)));
    const relatedFixtures = fixtures.filter((fixture) => liveDates.has(formatDateKey(fixture.startingAt)));
    return relatedFixtures.slice(0, 4);
  }

  const todayFixtures = fixtures.filter((fixture) => formatDateKey(fixture.startingAt) === today);
  if (todayFixtures.length) {
    return todayFixtures.slice(0, 4);
  }

  const upcomingFixtures = fixtures.filter((fixture) => formatDateKey(fixture.startingAt) >= today);
  if (upcomingFixtures.length) {
    return upcomingFixtures.slice(0, 4);
  }

  return fixtures.slice(0, 4);
}

function buildDateTabs(fixtures) {
  const uniqueDates = [...new Set(fixtures.map((fixture) => formatDateKey(fixture.startingAt)).filter(Boolean))].sort();
  const today = getTodayDateKey();
  const tomorrow = getTomorrowDateKey();

  return uniqueDates.map((date) => {
    const dateValue = new Date(`${date}T00:00:00Z`);
    const day = new Intl.DateTimeFormat("zh-CN", {
      day: "2-digit",
      timeZone: "Asia/Tokyo",
    }).format(dateValue);

    let label = new Intl.DateTimeFormat("zh-CN", {
      weekday: "short",
      timeZone: "Asia/Tokyo",
    }).format(dateValue);

    if (date === today) {
      label = "今天";
    } else if (date === tomorrow) {
      label = "明天";
    }

    return { key: date, day, label };
  });
}

function buildQuickStats(fixtures, standingsGroups) {
  const teamSet = new Set();
  standingsGroups.forEach((group) => {
    group.rows.forEach((row) => {
      teamSet.add(row.originalName || row.name);
    });
  });
  fixtures.forEach((fixture) => {
    teamSet.add(fixture.home.originalName || fixture.home.name);
    teamSet.add(fixture.away.originalName || fixture.away.name);
  });

  const cityCount = new Set(fixtures.map((fixture) => fixture.venue).filter(Boolean)).size;
  const firstKickoff = fixtures[0]?.startingAt;
  const openingDay = firstKickoff
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Tokyo",
      })
        .format(new Date(firstKickoff))
        .replace("/", ".")
    : "06.11";

  return [
    { value: String(teamSet.size || 48), label: "参赛球队" },
    { value: String(fixtures.length || 0), label: "已载场次" },
    { value: String(cityCount || 0), label: "已载城市" },
    { value: "39", label: "天赛期" },
    { value: openingDay, label: "开幕日", compact: true },
  ];
}

function formatFixtureInfoLine(fixture) {
  if (!fixture?.startingAt) {
    return `${fixture?.venue || ""} · ${fixture?.kickoff || "--:--"} JST`.trim();
  }

  const dateValue = new Date(fixture.startingAt);
  const dateLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  })
    .format(dateValue)
    .replace("/", ".");
  const timeLabel = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(dateValue);

  return `${fixture.venue || ""} · ${dateLabel} ${timeLabel} JST`.trim();
}

function formatDateTimeLabel(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  })
    .format(dateValue)
    .replace("/", ".")
    .replace(" ", " ");
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(target) {
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSecs = Math.floor(remaining / 1000);
  const days    = Math.floor(totalSecs / 86400);
  const hours   = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  return { days, hours, minutes, seconds, started: remaining <= 0 };
}

// ─── Toast hook ───────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState({ visible: false, text: "" });
  const timerRef = useRef(null);

  const showToast = useCallback((text) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, text });
    timerRef.current = setTimeout(() => setToast({ visible: false, text: "" }), 2200);
  }, []);

  return { toast, showToast };
}

// ─── Favorites hook ───────────────────────────────────────────────────────────

function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(JSON.parse(window?.localStorage?.getItem("wc-favorites") || "[]"));
    } catch {
      return new Set();
    }
  });

  const toggle = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        window.localStorage.setItem("wc-favorites", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  return { favorites, toggle };
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRows({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton skeleton-circle" />
          <div className="skeleton-lines">
            <div className="skeleton skeleton-block" style={{ width: "55%" }} />
            <div className="skeleton skeleton-block" style={{ width: "35%" }} />
          </div>
          <div className="skeleton skeleton-block" style={{ width: 40, height: 14 }} />
        </div>
      ))}
    </>
  );
}

// ─── Fixture row ──────────────────────────────────────────────────────────────

function FixtureRow({ fixture, onOpen }) {
  const hasScore =
    typeof fixture.homeScore === "number" && typeof fixture.awayScore === "number";

  return (
    <button className="fixture-row" type="button" onClick={() => onOpen(fixture)}>
      <div className="fix-time-col">
        {fixture.status === "LIVE" ? (
          <div className="fix-status-live">
            <span className="fix-live-dot" />
            LIVE
          </div>
        ) : (
          <div
            className={cn(
              fixture.status === "FT" && "fix-status-ft",
              fixture.status === "NS" && "fix-status-ns"
            )}
          >
            {fixture.status}
          </div>
        )}
        <div className="fix-time">
          {fixture.status === "FT" ? "" : fixture.minute || fixture.kickoff}
        </div>
      </div>
      <div className="fix-teams-col">
        <div
          className={cn(
            "fix-team-row",
            fixture.homeScore > fixture.awayScore && "winner",
            hasScore && fixture.homeScore < fixture.awayScore && "loser"
          )}
        >
          <span>{fixture.home.flag}</span>
          <span>{fixture.home.name}</span>
        </div>
        <div
          className={cn(
            "fix-team-row",
            fixture.awayScore > fixture.homeScore && "winner",
            hasScore && fixture.awayScore < fixture.homeScore && "loser"
          )}
        >
          <span>{fixture.away.flag}</span>
          <span>{fixture.away.name}</span>
        </div>
      </div>
      <div className="fix-score-col">
        {hasScore ? (
          <>
            <div className={cn("fix-goal", fixture.homeScore >= fixture.awayScore ? "is-strong" : "is-dim")}>
              {fixture.homeScore}
            </div>
            <div className={cn("fix-goal", fixture.awayScore >= fixture.homeScore ? "is-strong" : "is-dim")}>
              {fixture.awayScore}
            </div>
          </>
        ) : (
          <div className="fix-goal is-muted">—</div>
        )}
      </div>
      <div className="fix-arrow">
        <ChevronRight size={14} />
      </div>
    </button>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="section-title">
      <span>{title}</span>
      {action ? (
        <a href="#" onClick={onAction ? (e) => { e.preventDefault(); onAction(); } : undefined}>
          {action}
        </a>
      ) : null}
    </div>
  );
}

// ─── Countdown card ───────────────────────────────────────────────────────────

function CountdownCard() {
  const { days, hours, minutes, seconds, started } = useCountdown(WC_OPENING.getTime());

  if (started) return null;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="countdown-card">
      <div className="countdown-label">
        <Zap size={10} />
        距离世界杯开幕
      </div>
      <div className="countdown-units">
        <div className="countdown-unit">
          <div className="countdown-num">{days}</div>
          <div className="countdown-sublabel">DAYS</div>
        </div>
        <div className="countdown-sep">:</div>
        <div className="countdown-unit">
          <div className="countdown-num">{pad(hours)}</div>
          <div className="countdown-sublabel">HRS</div>
        </div>
        <div className="countdown-sep">:</div>
        <div className="countdown-unit">
          <div className="countdown-num">{pad(minutes)}</div>
          <div className="countdown-sublabel">MIN</div>
        </div>
        <div className="countdown-sep">:</div>
        <div className="countdown-unit">
          <div className="countdown-num">{pad(seconds)}</div>
          <div className="countdown-sublabel">SEC</div>
        </div>
      </div>
      <div className="countdown-sub">🇺🇸 🇨🇦 🇲🇽 · 2026.06.11 开幕 · 48 支球队</div>
    </div>
  );
}

// ─── Prediction Top-3 cards ───────────────────────────────────────────────────

function PredictionTop3({ teams }) {
  const medals = ["🥇", "🥈", "🥉"];
  const rankClass = ["rank-1", "rank-2", "rank-3"];
  const top3 = teams.slice(0, 3);

  if (!top3.length) return null;

  return (
    <div className="pred-top3">
      {top3.map((team, i) => (
        <div key={team.rank} className={cn("pred-top3-card", rankClass[i])}>
          <div className="pred-top3-medal">{medals[i]}</div>
          <div className="pred-top3-flag">{team.flag}</div>
          <div className="pred-top3-name">{team.name}</div>
          <div className="pred-top3-pct">{team.titleProbability || "—"}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorldCupApp() {
  const [activePage, setActivePage] = useState("home");
  const [dataMode, setDataMode] = useState(DATA_MODES.LIVE);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("live");
  const [activeFixture, setActiveFixture] = useState(null);
  const [fixturesData, setFixturesData] = useState({
    source: "loading",
    fixtures: [],
    groupedFixtures: [],
    standings: [],
    liveCount: 0,
  });
  const [isFixturesLoading, setIsFixturesLoading] = useState(true);
  const [eloData, setEloData] = useState({
    rankings: eloRankings,
    method: eloMethodNote,
    updatedAt: null,
    source: "local",
  });
  const [predictionData, setPredictionData] = useState({
    teams: predictions.map((team) => ({
      ...team,
      titleProbability: team.pct,
    })),
    method: eloMethodNote,
    updatedAt: null,
    simulationCount: 0,
  });
  const [eloTrendData, setEloTrendData] = useState({
    teams: [],
    updatedAt: null,
    method: "",
  });
  const [activeTrendTeam, setActiveTrendTeam] = useState("brazil");
  const [historyData, setHistoryData] = useState({
    tournaments: historyTournaments,
    teams: [],
  });
  const [historyMetrics, setHistoryMetrics] = useState({ byName: {} });
  const [matchDetails, setMatchDetails] = useState({});
  const [historyTeamOpen, setHistoryTeamOpen] = useState(false);
  const [activeHistoryTeam, setActiveHistoryTeam] = useState(null);
  const initialSimulatorScenarios = buildAdaptiveSimulatorScenarios(standings, groupedFixtures, simulatorScenarios);
  const [activeSimulatorGroup, setActiveSimulatorGroup] = useState(initialSimulatorScenarios[0].group);
  const initialDateTabs = buildDateTabs([]);

  // ─── Default date tab to today ───────────────────────────────────────────
  const [activeFixtureDate, setActiveFixtureDate] = useState(() => {
    const today = getTodayDateKey();
    return initialDateTabs.find((t) => t.key === today)?.key || initialDateTabs[0]?.key || "";
  });

  const [simulatorState, setSimulatorState] = useState(() =>
    Object.fromEntries(initialSimulatorScenarios.map((scenario) => [scenario.group, scenario.matches]))
  );
  const detailRef = useRef(null);
  const touchStartRef = useRef(0);
  const dateTabsRef = useRef(null);

  const { toast, showToast } = useToast();
  const { favorites, toggle: toggleFavorite } = useFavorites();

  // ─── Load saved data mode ─────────────────────────────────────────────────
  useEffect(() => {
    const savedMode = window.localStorage.getItem("worldcup-data-mode");
    if (savedMode === DATA_MODES.DRILL) {
      setDataMode(DATA_MODES.DRILL);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("worldcup-data-mode", dataMode);
  }, [dataMode]);

  // ─── Load static data ─────────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;

    async function loadStaticData() {
      try {
        const [eloResponse, historyResponse] = await Promise.all([
          fetch("/data/elo.json", { cache: "no-store" }),
          fetch("/data/history/tournaments.json", { cache: "no-store" }),
        ]);
        const teamsResponse = await fetch("/data/history/teams.json", { cache: "no-store" });
        const historyIndexResponse = await fetch("/data/elo-history/index.json", { cache: "no-store" });
        const trendsResponse = await fetch("/data/elo-trends.json", { cache: "no-store" });
        const predictionsResponse = await fetch("/data/predictions.json", { cache: "no-store" });

        if (!ignore && eloResponse.ok) {
          const payload = await eloResponse.json();
          setEloData({
            rankings: payload.rankings?.length ? normalizeTeamList(payload.rankings) : eloRankings,
            method: payload.method || eloMethodNote,
            updatedAt: payload.updatedAt || null,
            source: payload.source || "local",
          });
        }

        if (!ignore && historyResponse.ok) {
          const payload = await historyResponse.json();
          setHistoryData((current) => ({
            tournaments: payload.tournaments?.length ? payload.tournaments : historyTournaments,
            teams: current.teams,
          }));
        }

        if (!ignore && teamsResponse.ok) {
          const payload = await teamsResponse.json();
          setHistoryData((current) => ({
            tournaments: current.tournaments,
            teams: payload.teams?.length ? normalizeHistoryTeams(payload.teams) : [],
          }));
        }

        if (!ignore && historyIndexResponse.ok) {
          const payload = await historyIndexResponse.json();
          const byName = Object.fromEntries(
            (payload.teams || []).flatMap((team) => {
              const normalized = normalizeTeamDisplay({
                name: team.name,
                originalName: team.name,
                flag: team.flag,
              });
              return [
                [team.name, team],
                [normalized.name, team],
              ];
            })
          );
          setHistoryMetrics({ byName });
        }

        if (!ignore && trendsResponse.ok) {
          const payload = await trendsResponse.json();
          setEloTrendData({
            teams: payload.teams?.length ? normalizeTrendTeams(payload.teams) : [],
            updatedAt: payload.updatedAt || null,
            method: payload.method || "",
          });
          if (payload.teams?.[0]?.id) {
            setActiveTrendTeam(payload.teams[0].id);
          }
        }

        if (!ignore && predictionsResponse.ok) {
          const payload = await predictionsResponse.json();
          setPredictionData({
            teams: payload.teams?.length
              ? normalizeTeamList(payload.teams)
              : predictions.map((team) => ({
                  ...team,
                  titleProbability: team.pct,
                })),
            method: payload.method || eloMethodNote,
            updatedAt: payload.updatedAt || null,
            simulationCount: payload.simulationCount || 0,
          });
        }
      } catch (error) {
        console.warn("Failed to load static data, keeping fallback mock data.", error);
      }
    }

    loadStaticData();
    return () => { ignore = true; };
  }, []);

  // ─── Touch swipe to close detail ─────────────────────────────────────────
  useEffect(() => {
    const node = detailRef.current;
    if (!node) return undefined;

    function handleTouchStart(event) {
      touchStartRef.current = event.touches[0]?.clientX || 0;
    }

    function handleTouchEnd(event) {
      const endX = event.changedTouches[0]?.clientX || 0;
      if (endX - touchStartRef.current > 80) {
        setDetailOpen(false);
      }
    }

    node.addEventListener("touchstart", handleTouchStart, { passive: true });
    node.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // ─── Fixture loading ──────────────────────────────────────────────────────
  async function loadFixtures() {
    setIsFixturesLoading(true);
    try {
      const response = await fetch(`/api/fixtures?mode=${dataMode}`, { cache: "no-store" });
      if (!response.ok) {
        setIsFixturesLoading(false);
        return null;
      }

      const payload = await response.json();
      const nextFixtures = payload.fixtures?.length ? payload.fixtures : [];
      const nextGroupedFixtures = payload.groupedFixtures?.length ? payload.groupedFixtures : [];
      const nextStandings = payload.standings?.length ? payload.standings : [];

      setFixturesData({
        source: payload.source,
        fixtures: nextFixtures,
        groupedFixtures: nextGroupedFixtures,
        standings: nextStandings,
        liveCount: typeof payload.liveCount === "number" ? payload.liveCount : 0,
      });

      const nextDateTabs = buildDateTabs(nextFixtures);
      if (nextDateTabs.length) {
        setActiveFixtureDate((current) => {
          // Auto-select today if available, otherwise keep current or first
          const today = getTodayDateKey();
          if (nextDateTabs.some((t) => t.key === today)) return today;
          return nextDateTabs.some((t) => t.key === current) ? current : nextDateTabs[0].key;
        });
      } else {
        setActiveFixtureDate("");
      }
      setActiveFixture((current) =>
        nextFixtures.find((fixture) => fixture.id === current?.id) || current || nextFixtures[0] || null
      );

      return payload;
    } catch (error) {
      console.warn("Failed to load fixture data, keeping fallback mock data.", error);
      return null;
    } finally {
      setIsFixturesLoading(false);
    }
  }

  async function loadMatchDetail(fixtureId, options = {}) {
    const { force = false } = options;
    if (!force && matchDetails[fixtureId]) return matchDetails[fixtureId];

    try {
      const response = await fetch(`/api/match/${fixtureId}?mode=${dataMode}`, { cache: "no-store" });
      if (!response.ok) return null;
      const payload = await response.json();
      setMatchDetails((current) => ({ ...current, [fixtureId]: payload }));
      return payload;
    } catch (error) {
      console.warn("Failed to load match detail.", error);
      return null;
    }
  }

  useEffect(() => {
    setMatchDetails({});
    loadFixtures();
  }, [dataMode]);

  useEffect(() => {
    if (!fixturesData.liveCount || !["home", "fixtures"].includes(activePage)) return undefined;
    const intervalId = window.setInterval(() => { loadFixtures(); }, 30000);
    return () => { window.clearInterval(intervalId); };
  }, [activePage, fixturesData.liveCount]);

  useEffect(() => {
    if (!detailOpen || !activeFixture || detailTab !== "live" || activeFixture.status !== "LIVE") return undefined;
    loadMatchDetail(activeFixture.id, { force: true });
    const intervalId = window.setInterval(() => {
      loadMatchDetail(activeFixture.id, { force: true });
    }, 30000);
    return () => { window.clearInterval(intervalId); };
  }, [activeFixture?.id, activeFixture?.status, detailOpen, detailTab]);

  // ─── Scroll date tab to today ──────────────────────────────────────────────
  useEffect(() => {
    if (!dateTabsRef.current) return;
    const activeTab = dateTabsRef.current.querySelector(".date-tab.active");
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeFixtureDate, activePage]);

  async function openMatch(fixture) {
    if (!fixture) return;
    setActiveFixture(fixture);
    setDetailTab("live");
    setDetailOpen(true);
    await loadMatchDetail(fixture.id, { force: fixture.status === "LIVE" });
  }

  function toggleDataMode() {
    setDataMode((current) => (current === DATA_MODES.LIVE ? DATA_MODES.DRILL : DATA_MODES.LIVE));
  }

  // ─── Share prediction ─────────────────────────────────────────────────────
  function sharePrediction(team) {
    const text = `我预测 ${team.flag} ${team.name} 夺得2026世界杯冠军！概率 ${team.titleProbability} 🏆\n2026.djyylive.com`;
    if (navigator.share) {
      navigator.share({ title: "2026世界杯冠军预测", text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast("已复制到剪贴板 ✓"));
    } else {
      showToast("分享功能需要 HTTPS 环境");
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────
  const fixtures = fixturesData.fixtures;
  const groups = fixturesData.groupedFixtures;
  const standingsGroups = fixturesData.standings;
  const liveCount = fixturesData.liveCount;
  const homePageFixtures = selectHomeFixtures(fixtures);
  const quickStats = buildQuickStats(fixtures, standingsGroups);
  const dateTabs = buildDateTabs(fixtures);
  const visibleGroups = activeFixtureDate
    ? groups
        .map((group) => ({
          ...group,
          matches: group.matches.filter((fixture) => formatDateKey(fixture.startingAt) === activeFixtureDate),
        }))
        .filter((group) => group.matches.length)
    : groups;
  const simulatorScenariosLive = buildAdaptiveSimulatorScenarios(standingsGroups, groups, simulatorScenarios);
  const liveBannerFixture = fixtures.find((fixture) => fixture.status === "LIVE") || fixtures[0] || null;
  const detailPayload = activeFixture ? matchDetails[activeFixture.id] : null;
  const detailFixture =
    detailPayload?.fixture ||
    activeFixture || {
      id: "",
      stage: "世界杯",
      status: "NS",
      minute: "",
      kickoff: "",
      home: { flag: "🏳️", name: "待定", elo: null },
      away: { flag: "🏳️", name: "待定", elo: null },
      venue: "",
    };
  const detailLiveStats = detailPayload?.stats || liveStats;
  const detailEvents = detailPayload?.events || eventTimeline;
  const detailH2HSummary = detailPayload?.h2hSummary || h2hSummary;
  const detailH2HMatches = detailPayload?.h2hMatches || h2hMatches;
  const detailStatGrid = detailPayload?.statGrid || statGrid;
  const detailOdds = detailPayload?.odds || [
    { label: "主胜", value: "2.10", implied: "47.6%" },
    { label: "平局", value: "3.40", implied: "29.4%" },
    { label: "客胜", value: "3.20", implied: "31.3%" },
  ];
  const detailProbabilities = detailPayload?.probabilities || { home: 46, draw: 26, away: 28 };
  const liveBannerLabel = liveBannerFixture?.status === "LIVE" ? "LIVE" : liveBannerFixture?.status;
  const homeFixtureTitle = homePageFixtures.some((fixture) => formatDateKey(fixture.startingAt) === getTodayDateKey())
    ? "今日赛事"
    : "近期赛事";
  const trendTeam =
    eloTrendData.teams.find((team) => team.id === activeTrendTeam) || eloTrendData.teams[0] || null;
  const featuredTrendTeams = eloTrendData.teams.slice(0, 8);
  const detailScore =
    typeof detailFixture.homeScore === "number" && typeof detailFixture.awayScore === "number"
      ? `${detailFixture.homeScore}—${detailFixture.awayScore}`
      : "—";
  const activeScenario =
    simulatorScenariosLive.find((scenario) => scenario.group === activeSimulatorGroup) || simulatorScenariosLive[0];
  const simulatorMatches = simulatorState[activeScenario.group] || activeScenario.matches;
  const simulatedStandings = buildSimulatedStandings(activeScenario.teams, simulatorMatches);

  function updateSimulatorScore(matchId, side, value) {
    const nextValue = value === "" ? "" : Math.max(0, Number(value));
    setSimulatorState((current) => ({
      ...current,
      [activeScenario.group]: current[activeScenario.group].map((match) =>
        match.id === matchId ? { ...match, [side]: nextValue } : match
      ),
    }));
  }

  function resetSimulatorGroup() {
    setSimulatorState((current) => ({
      ...current,
      [activeScenario.group]: activeScenario.matches,
    }));
  }

  function openHistoryTeam(team) {
    setActiveHistoryTeam(team);
    setHistoryTeamOpen(true);
  }

  const historyTeams = historyData.teams.map((team) =>
    enrichHistoryTeam(team, eloData.rankings, historyMetrics.byName)
  );

  useEffect(() => {
    const adaptiveScenarios = buildAdaptiveSimulatorScenarios(standingsGroups, groups, simulatorScenarios);
    setSimulatorState((current) => {
      const nextState = { ...current };
      adaptiveScenarios.forEach((scenario) => {
        if (!nextState[scenario.group]) {
          nextState[scenario.group] = scenario.matches;
        }
      });
      return nextState;
    });
    if (!adaptiveScenarios.some((scenario) => scenario.group === activeSimulatorGroup)) {
      setActiveSimulatorGroup(adaptiveScenarios[0].group);
    }
  }, [activeSimulatorGroup, groups, standingsGroups]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="site-shell">
      <div className="app-frame">
        <div className="app">

          {/* ── Topbar ────────────────────────────────────────────────────── */}
          <header className="topbar">
            <div className="topbar-logo">
              DJYY
              <small>2026 WORLD CUP</small>
            </div>
            <div className="topbar-right">
              <button
                className={cn("mode-pill", dataMode === DATA_MODES.DRILL && "active")}
                type="button"
                onClick={toggleDataMode}
              >
                {dataMode === DATA_MODES.DRILL ? "演练中" : "正式"}
              </button>
              <button
                className="live-pill"
                type="button"
                onClick={() => openMatch(liveBannerFixture)}
                disabled={!liveBannerFixture}
              >
                <div className="live-dot" />
                {liveCount} LIVE
              </button>
              <button className="search-btn" type="button" aria-label="搜索">
                <Search size={15} />
              </button>
            </div>
          </header>

          {/* ── Pages ─────────────────────────────────────────────────────── */}
          <div className="pages">

            {/* ── Home page ─────────────────────────────────────────────── */}
            <div className={cn("page", activePage === "home" && "active")}>
              {dataMode === DATA_MODES.DRILL ? (
                <div className="mode-banner">
                  <div className="mode-banner-title">演练模式已开启</div>
                  <div className="mode-banner-copy">当前展示的是用于赛时演练的模拟比赛、积分与详情数据，不影响正式线上链路。</div>
                </div>
              ) : null}

              {/* Countdown */}
              <CountdownCard />

              {/* Live banner */}
              {fixturesData.liveCount ? (
                <div className="live-banner" onClick={() => openMatch(liveBannerFixture)}>
                  <div>
                    <div className="banner-label">
                      <div className="live-dot" />
                      {liveBannerLabel} · {liveBannerFixture.stage}
                    </div>
                    <div className="banner-teams">
                      <span>{liveBannerFixture.home.flag}</span>
                      <span>{liveBannerFixture.home.name}</span>
                    </div>
                    <div className="banner-teams banner-subteams">
                      <span>vs {liveBannerFixture.away.flag}</span>
                      <span>{liveBannerFixture.away.name}</span>
                    </div>
                  </div>
                  <div className="banner-right">
                    <div className="banner-score-big">
                      {typeof liveBannerFixture.homeScore === "number" ? liveBannerFixture.homeScore : "—"} -{" "}
                      {typeof liveBannerFixture.awayScore === "number" ? liveBannerFixture.awayScore : "—"}
                    </div>
                    <span className="min-badge">{liveBannerFixture.minute}</span>
                    <div className="banner-hint">点击查看详情 →</div>
                  </div>
                </div>
              ) : null}

              {/* Quick stats */}
              <div className="card">
                <div className="stats-strip">
                  {quickStats.map((item) => (
                    <div className="stat-chip" key={item.label}>
                      <div className={cn("stat-num", item.compact && "compact")}>{item.value}</div>
                      <div className="stat-lbl">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's fixtures */}
              <SectionTitle title={homeFixtureTitle} action="全部 →" onAction={() => setActivePage("fixtures")} />
              <div className="card">
                {isFixturesLoading ? (
                  <SkeletonRows count={3} />
                ) : homePageFixtures.length ? (
                  homePageFixtures.map((fixture) => (
                    <FixtureRow fixture={fixture} key={fixture.id} onOpen={openMatch} />
                  ))
                ) : (
                  <div className="state-card">
                    <div className="state-title">暂无可展示比赛</div>
                    <div className="state-copy">等官方赛程确认后，这里会自动更新。</div>
                  </div>
                )}
              </div>

              {/* Elo rankings */}
              <SectionTitle title="Elo 实力排名" action="完整榜 →" onAction={() => setActivePage("predict")} />
              <div className="card">
                {isFixturesLoading ? (
                  <SkeletonRows count={5} />
                ) : (
                  eloData.rankings.slice(0, 5).map((team) => (
                    <div className="elo-row" key={team.rank}>
                      <div className="elo-rank">{team.rank}</div>
                      <div className="elo-team">
                        <span>{team.flag}</span>
                        <span>{team.name}</span>
                      </div>
                      <div>
                        <div className="elo-score">{team.elo}</div>
                        <div className="elo-bar">
                          <div className="elo-fill" style={{ width: `${team.width}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="page-space" />
            </div>

            {/* ── Fixtures page ─────────────────────────────────────────── */}
            <div className={cn("page", activePage === "fixtures" && "active")}>
              {dateTabs.length ? (
                <div className="date-tabs" ref={dateTabsRef}>
                  {dateTabs.map((date) => (
                    <button
                      className={cn("date-tab", activeFixtureDate === date.key && "active")}
                      key={date.key}
                      type="button"
                      onClick={() => setActiveFixtureDate(date.key)}
                    >
                      <span className="d-num">{date.day}</span>
                      {date.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {isFixturesLoading ? (
                <div className="group-card">
                  <SkeletonRows count={6} />
                </div>
              ) : visibleGroups.length ? (
                visibleGroups.map((group) => (
                  <div key={group.label}>
                    <div className="group-label">{group.label}</div>
                    <div className="card">
                      {group.matches.map((fixture) => (
                        <FixtureRow fixture={fixture} key={fixture.id} onOpen={openMatch} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="group-card">
                  <div className="state-card">
                    <div className="state-title">这个日期暂无比赛</div>
                    <div className="state-copy">你可以切换上方日期，查看其他比赛日。</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Groups page ───────────────────────────────────────────── */}
            <div className={cn("page", activePage === "groups" && "active")}>
              <div className="legend-strip">
                {groupLegend.map((item) => (
                  <div className="legend-item" key={item.label}>
                    <span className={cn("legend-bar", item.tone)} />
                    {item.label}
                  </div>
                ))}
              </div>

              {isFixturesLoading ? (
                <div className="group-card">
                  <SkeletonRows count={8} />
                </div>
              ) : standingsGroups.length ? (
                standingsGroups.map((group) => (
                  <div className="group-card" key={group.group}>
                    <div className="group-header">
                      <div className="group-letter">{group.group}</div>
                      <div className="group-cols">
                        <span>场</span>
                        <span>胜</span>
                        <span>平</span>
                        <span>负</span>
                        <span>分</span>
                      </div>
                    </div>
                    {group.rows.map((row) => (
                      <div className="group-team-row" key={`${group.group}-${row.name}`}>
                        <span className="gt-pos">{row.pos}</span>
                        <div className={cn("qt-bar", row.tone.split(" ")[0])} />
                        <div className={cn("gt-name", row.tone.includes("danger") && "danger")}>
                          <span>{row.flag}</span>
                          <span>{row.name}</span>
                        </div>
                        <div className="gt-stats">
                          <span className="gt-stat">{row.p}</span>
                          <span className="gt-stat">{row.w}</span>
                          <span className="gt-stat">{row.d}</span>
                          <span className="gt-stat">{row.l}</span>
                          <span className="gt-pts">{row.pts}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="group-card">
                  <div className="state-card">
                    <div className="state-title">积分榜暂未生成</div>
                    <div className="state-copy">官方小组数据一旦发布，这里会自动更新。</div>
                  </div>
                </div>
              )}

              <SectionTitle title="小组出线模拟器" />
              <div className="group-card simulator-card">
                <div className="group-header">
                  <div className="group-letter">{activeScenario.group}</div>
                  <button className="simulator-reset" type="button" onClick={resetSimulatorGroup}>
                    重置比分
                  </button>
                </div>
                <div className="simulator-tabs">
                  {simulatorScenariosLive.map((scenario) => (
                    <button
                      key={scenario.group}
                      type="button"
                      className={cn("simulator-tab", scenario.group === activeScenario.group && "active")}
                      onClick={() => setActiveSimulatorGroup(scenario.group)}
                    >
                      {scenario.group}
                    </button>
                  ))}
                </div>
                <div className="simulator-intro">{activeScenario.note}</div>
                <div className="simulator-match-list">
                  {simulatorMatches.map((match) => (
                    <div className="simulator-match" key={match.id}>
                      <div className="sim-team">
                        <span>{match.home.flag}</span>
                        <span>{match.home.name}</span>
                      </div>
                      <div className="sim-score-inputs">
                        <input
                          aria-label={`${match.home.name}比分`}
                          inputMode="numeric"
                          min="0"
                          type="number"
                          value={match.homeScore}
                          onChange={(event) => updateSimulatorScore(match.id, "homeScore", event.target.value)}
                        />
                        <span>:</span>
                        <input
                          aria-label={`${match.away.name}比分`}
                          inputMode="numeric"
                          min="0"
                          type="number"
                          value={match.awayScore}
                          onChange={(event) => updateSimulatorScore(match.id, "awayScore", event.target.value)}
                        />
                      </div>
                      <div className="sim-team sim-team-right">
                        <span>{match.away.name}</span>
                        <span>{match.away.flag}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="simulator-cols">
                  <span>场</span><span>胜</span><span>平</span><span>负</span><span>净</span><span>进</span><span>分</span>
                </div>
                <div className="simulator-table">
                  {simulatedStandings.map((row) => (
                    <div className="group-team-row" key={`sim-${row.name}`}>
                      <span className="gt-pos">{row.pos}</span>
                      <div className={cn("qt-bar", row.tone.split(" ")[0])} />
                      <div className={cn("gt-name", row.tone.includes("danger") && "danger")}>
                        <span>{row.flag}</span>
                        <span>{row.name}</span>
                      </div>
                      <div className="gt-stats">
                        <span className="gt-stat">{row.p}</span>
                        <span className="gt-stat">{row.w}</span>
                        <span className="gt-stat">{row.d}</span>
                        <span className="gt-stat">{row.l}</span>
                        <span className="gt-stat">{row.gd}</span>
                        <span className="gt-stat">{row.gf}</span>
                        <span className="gt-pts">{row.pts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="page-space" />
            </div>

            {/* ── Predict page ──────────────────────────────────────────── */}
            <div className={cn("page", activePage === "predict" && "active")}>
              <SectionTitle title="夺冠概率 · Elo 模型" />

              {/* Top 3 podium cards */}
              <div className="card">
                <PredictionTop3 teams={predictionData.teams} />
                {predictionData.teams.map((team) => (
                  <div className="pred-list-item" key={team.rank}>
                    <div className="pred-rank">{team.rank}</div>
                    <div className="pred-team">
                      <span>{team.flag}</span>
                      <span>{team.name}</span>
                    </div>
                    <button
                      className={cn("fav-btn", favorites.has(`pred-${team.rank}`) && "active")}
                      type="button"
                      aria-label="收藏"
                      onClick={() => {
                        toggleFavorite(`pred-${team.rank}`);
                        showToast(favorites.has(`pred-${team.rank}`) ? "已取消收藏" : `已收藏 ${team.name}`);
                      }}
                    >
                      <Heart size={13} fill={favorites.has(`pred-${team.rank}`) ? "currentColor" : "none"} />
                    </button>
                    <div className="pred-right">
                      <div className="pred-pct">{team.titleProbability || predictions.find((item) => item.rank === team.rank)?.pct || "—"}</div>
                      <div className="pred-bar-wrap">
                        <div className="pred-bar-fill" style={{ width: `${team.width}%` }} />
                      </div>
                    </div>
                    <button
                      className="share-btn"
                      type="button"
                      onClick={() => sharePrediction(team)}
                      aria-label="分享"
                    >
                      <Share2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <SectionTitle title="当前 Elo 排名" action="Top 10" />
              <div className="card">
                {eloData.rankings.slice(0, 10).map((team) => (
                  <div className="elo-row" key={`predict-elo-${team.rank}`}>
                    <div className="elo-rank">{team.rank}</div>
                    <div className="elo-team">
                      <span>{team.flag}</span>
                      <span>{team.name}</span>
                    </div>
                    <div>
                      <div className="elo-score">{team.elo}</div>
                      <div className="elo-bar">
                        <div className="elo-fill" style={{ width: `${team.width}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {trendTeam ? (
                <>
                  <SectionTitle title="Elo 走势" action="近 12 年 →" />
                  <div className="trend-card">
                    <div className="trend-tools">
                      <div className="trend-tabs">
                        {featuredTrendTeams.map((team) => (
                          <button
                            key={team.id}
                            type="button"
                            className={cn("trend-tab", team.id === trendTeam.id && "active")}
                            onClick={() => setActiveTrendTeam(team.id)}
                          >
                            {team.flag} {team.name}
                          </button>
                        ))}
                      </div>
                      <label className="trend-select-wrap">
                        <span className="trend-select-label">全部 48 队</span>
                        <select
                          className="trend-select"
                          value={trendTeam.id}
                          onChange={(event) => setActiveTrendTeam(event.target.value)}
                        >
                          {eloTrendData.teams.map((team) => (
                            <option key={`option-${team.id}`} value={team.id}>
                              {team.rank ? `#${team.rank} ` : ""}{team.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="trend-head">
                      <div>
                        <div className="trend-title">{trendTeam.flag} {trendTeam.name}</div>
                        <div className="trend-subtitle">来自本地 Elo 历史资料库的近 12 年抽样走势</div>
                      </div>
                      <div className="trend-current">{trendTeam.points[trendTeam.points.length - 1]?.elo}</div>
                    </div>
                    <div className="trend-summary-grid">
                      <div className="trend-summary-card">
                        <div className="trend-summary-label">当前排名</div>
                        <div className="trend-summary-value">{trendTeam.rank ? `#${trendTeam.rank}` : "—"}</div>
                      </div>
                      <div className="trend-summary-card">
                        <div className="trend-summary-label">历史样本</div>
                        <div className="trend-summary-value">{trendTeam.matchCount ? `${trendTeam.matchCount} 场` : "—"}</div>
                      </div>
                      <div className="trend-summary-card">
                        <div className="trend-summary-label">覆盖球队</div>
                        <div className="trend-summary-value">{eloTrendData.teams.length} 队</div>
                      </div>
                    </div>
                    <EloTrendChart team={trendTeam} />
                  </div>
                </>
              ) : null}

              <SectionTitle title="说明" />
              <div className="predict-note">
                <div className="elo-meta-grid">
                  <div className="elo-meta-card">
                    <div className="elo-meta-label">Elo 更新时间</div>
                    <div className="elo-meta-value">{formatDateTimeLabel(eloData.updatedAt)}</div>
                  </div>
                  <div className="elo-meta-card">
                    <div className="elo-meta-label">概率样本数</div>
                    <div className="elo-meta-value">
                      {predictionData.simulationCount ? `${predictionData.simulationCount.toLocaleString("en-US")} 次` : "—"}
                    </div>
                  </div>
                  <div className="elo-meta-card">
                    <div className="elo-meta-label">走势来源</div>
                    <div className="elo-meta-value">{eloTrendData.teams.length ? "本地历史库" : "—"}</div>
                  </div>
                </div>
                <p>{predictionData.method}</p>
                <p>{eloTrendData.method || eloData.method}</p>
              </div>
            </div>

            {/* ── History page ──────────────────────────────────────────── */}
            <div className={cn("page", activePage === "history" && "active")}>
              <div className="history-search">
                <span className="history-search-icon">
                  <Search size={14} />
                </span>
                <input type="text" placeholder="搜索球队、球员、届次…" readOnly />
              </div>

              <SectionTitle title="历届世界杯" />
              {/* Horizontal scrollable timeline */}
              <div className="wc-timeline-scroll">
                {historyData.tournaments.map((item) => (
                  <button className="wc-timeline-card" key={item.year} type="button">
                    <div className="wc-timeline-year">{item.year}</div>
                    <div className="wc-timeline-host">{item.host}</div>
                    <div className="wc-timeline-champ">
                      <Trophy size={11} style={{ color: "var(--gold)", flexShrink: 0 }} />
                      {item.champion}
                    </div>
                  </button>
                ))}
                {/* 2026 current edition */}
                <button className="wc-timeline-card" type="button" style={{ borderColor: "rgba(201,162,39,0.4)" }}>
                  <div className="wc-timeline-year" style={{ color: "var(--green)" }}>2026</div>
                  <div className="wc-timeline-host">🇺🇸🇨🇦🇲🇽 北美</div>
                  <div className="wc-timeline-champ" style={{ color: "var(--text-dim)" }}>
                    <Zap size={11} style={{ color: "var(--green)", flexShrink: 0 }} />
                    进行中
                  </div>
                </button>
              </div>

              <SectionTitle title="历史球队" action="热门 →" />
              <div className="history-team-grid">
                {historyTeams.map((team) => (
                  <button className="history-team-card" key={team.id} type="button" onClick={() => openHistoryTeam(team)}>
                    <div className="history-team-flag">{team.flag}</div>
                    <div className="history-team-name">{team.name}</div>
                    <div className="history-team-meta">
                      <span>{team.titles} 冠</span>
                      <span>{team.worldCups} 次参赛</span>
                      <span>ELO {team.currentElo ?? "—"}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="page-space" />
            </div>
          </div>

          {/* ── Bottom navigation ─────────────────────────────────────────── */}
          <nav className="bottom-nav">
            {NAV_ITEMS.map(({ id, Icon, label }) => (
              <button
                className={cn("nav-item", activePage === id && "active")}
                key={id}
                type="button"
                onClick={() => setActivePage(id)}
              >
                <div className="nav-icon">
                  <Icon size={20} strokeWidth={activePage === id ? 2 : 1.5} />
                </div>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Match detail panel ─────────────────────────────────────────────── */}
      <aside className={cn("match-detail-page", detailOpen && "open")} ref={detailRef}>
        <div className="detail-topbar">
          <button className="back-btn" type="button" onClick={() => setDetailOpen(false)} aria-label="返回">
            <ChevronLeft size={18} />
          </button>
          <div className="detail-title">比赛详情 · {detailFixture.stage}</div>
        </div>

        <div className="score-card">
          <div className="sc-team">
            <div className="sc-flag">{detailFixture.home.flag}</div>
            <div className="sc-name">{detailFixture.home.name}</div>
            <div className="sc-elo">ELO {detailFixture.home.elo ?? "—"}</div>
          </div>
          <div className="sc-center">
            <div className="sc-score">{detailScore}</div>
            <div>
              <span className="sc-badge">
                {detailFixture.status === "LIVE" ? `● ${detailFixture.minute}` : detailFixture.status}
              </span>
            </div>
            <div className="sc-info">{formatFixtureInfoLine(detailFixture)}</div>
          </div>
          <div className="sc-team">
            <div className="sc-flag">{detailFixture.away.flag}</div>
            <div className="sc-name">{detailFixture.away.name}</div>
            <div className="sc-elo">ELO {detailFixture.away.elo ?? "—"}</div>
          </div>
        </div>

        <div className="detail-tabs">
          {detailTabs.map((tab) => (
            <button
              className={cn("detail-tab", detailTab === tab.id && "active")}
              key={tab.id}
              type="button"
              onClick={() => setDetailTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="detail-body">
          {detailTab === "live" ? (
            <>
              <div className="detail-section">
                <div className="detail-section-title">实时数据</div>
                {detailLiveStats.map((stat) => (
                  <div className="dual-stat" key={stat.label}>
                    <div className="dual-stat-header">
                      <span className="dual-val blue">{stat.left}</span>
                      <span className="dual-lbl">{stat.label}</span>
                      <span className="dual-val red">{stat.right}</span>
                    </div>
                    <div className="dual-bar">
                      <div className="dual-l" style={{ width: `${stat.leftWidth}%` }} />
                      <div className="dual-r" style={{ width: `${stat.rightWidth}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="detail-section">
                <div className="detail-section-title">事件流</div>
                <div className="event-list">
                  {detailEvents.map((event) => (
                    <div className="event-item" key={`${event.minute}-${event.title}`}>
                      <div className="ev-min">{event.minute}</div>
                      <div className="ev-icon">{event.icon}</div>
                      <div className="ev-desc">
                        <div className="ev-player">{event.title}</div>
                        <div className="ev-sub">{event.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {detailTab === "predict" ? (
            <>
              <div className="prob-section">
                <div className="prob-title">ELO 胜率预测（赛前）</div>
                <div className="elo-compare">
                  <div className="elo-box">
                    <div className="elo-box-label">{detailFixture.home.flag} {detailFixture.home.name}</div>
                    <div className="elo-big">{detailFixture.home.elo ?? "—"}</div>
                    <div className="elo-trend up">↑ +12 近10场</div>
                  </div>
                  <div className="elo-box">
                    <div className="elo-box-label">{detailFixture.away.flag} {detailFixture.away.name}</div>
                    <div className="elo-big">{detailFixture.away.elo ?? "—"}</div>
                    <div className="elo-trend dn">↓ -8 近10场</div>
                  </div>
                </div>
              </div>
              <div className="detail-section">
                <div className="detail-section-title">胜平负概率</div>
                <div className="prob-teams">
                  <span className="blue">{detailFixture.home.flag} {detailFixture.home.name}胜</span>
                  <span className="dim">平局</span>
                  <span className="red">{detailFixture.away.flag} {detailFixture.away.name}胜</span>
                </div>
                <div className="prob-bar">
                  <div className="prob-w" style={{ width: `${detailProbabilities.home}%` }} />
                  <div className="prob-d" style={{ width: `${detailProbabilities.draw}%` }} />
                  <div className="prob-l" style={{ width: `${detailProbabilities.away}%` }} />
                </div>
                <div className="prob-pcts">
                  <span className="prob-pct blue">{detailProbabilities.home}%</span>
                  <span className="prob-pct dim">{detailProbabilities.draw}%</span>
                  <span className="prob-pct red">{detailProbabilities.away}%</span>
                </div>
                <div className="odds-row">
                  {detailOdds.map((item) => (
                    <div className="odds-box" key={item.label}>
                      <div className="odds-lbl">{item.label}</div>
                      <div className="odds-val">{item.value}</div>
                      <div className="odds-imp">{item.implied}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {detailTab === "h2h" ? (
            <div className="detail-section">
              <div className="detail-section-title">历史交手（世界杯）</div>
              <div className="h2h-bars">
                {detailH2HSummary.map((item) => (
                  <div className="h2h-b" key={item.label}>
                    <div className={cn("h2h-n", item.tone)}>{item.value}</div>
                    <div className="h2h-lbl">{item.label}</div>
                  </div>
                ))}
              </div>
              {detailH2HMatches.map((match) => (
                <div className="h2h-match" key={`${match.year}-${match.event}`}>
                  <div className="h2h-year">{match.year}</div>
                  <div className="ev-icon">⚽</div>
                  <div className="h2h-event">{match.event}</div>
                  <div className={cn("h2h-sc", match.tone)}>{match.score}</div>
                </div>
              ))}
            </div>
          ) : null}

          {detailTab === "stats" ? (
            <div className="detail-section">
              <div className="detail-section-title">完整数据（赛后更新）</div>
              <div className="stats-grid">
                {detailStatGrid.map((item) => (
                  <div className="stats-grid-card" key={item.label}>
                    <div className="stats-grid-value">{item.value}</div>
                    <div className="stats-grid-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* ── History team detail panel ─────────────────────────────────────── */}
      <aside className={cn("match-detail-page", historyTeamOpen && "open")}>
        <div className="detail-topbar">
          <button className="back-btn" type="button" onClick={() => setHistoryTeamOpen(false)} aria-label="返回">
            <ChevronLeft size={18} />
          </button>
          <div className="detail-title">历史球队详情</div>
        </div>

        {activeHistoryTeam ? (
          <>
            <div className="history-detail-hero">
              <div className="history-detail-flag">{activeHistoryTeam.flag}</div>
              <div className="history-detail-name">{activeHistoryTeam.name}</div>
              <div className="history-detail-summary">{activeHistoryTeam.summary}</div>
              <div className="history-detail-stats">
                <div className="history-stat-box">
                  <div className="history-stat-value">{activeHistoryTeam.titles}</div>
                  <div className="history-stat-label">世界杯冠军</div>
                </div>
                <div className="history-stat-box">
                  <div className="history-stat-value">{activeHistoryTeam.worldCups}</div>
                  <div className="history-stat-label">参赛次数</div>
                </div>
                <div className="history-stat-box">
                  <div className="history-stat-value">{activeHistoryTeam.lastAppearance}</div>
                  <div className="history-stat-label">最近参赛</div>
                </div>
                <div className="history-stat-box">
                  <div className="history-stat-value">{activeHistoryTeam.currentElo ?? "—"}</div>
                  <div className="history-stat-label">当前 Elo</div>
                </div>
              </div>
              <div className="history-detail-badges">
                <span className="history-badge">最佳战绩 · {activeHistoryTeam.bestFinish}</span>
                <span className="history-badge">世界杯参赛 · {activeHistoryTeam.worldCups} 届</span>
                <span className="history-badge">历史样本 · {activeHistoryTeam.historyMatchCount ?? "—"} 场</span>
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-section">
                <div className="detail-section-title">历史亮点</div>
                <div className="history-highlight-list">
                  {activeHistoryTeam.highlights.map((item) => (
                    <div className="history-highlight-item" key={item}>{item}</div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <div className="detail-section-title">世界杯时间线</div>
                <div className="history-timeline-list">
                  {activeHistoryTeam.timeline.map((item) => (
                    <div className="history-timeline-item" key={`${activeHistoryTeam.id}-${item.year}`}>
                      <div className="history-timeline-year">{item.year}</div>
                      <div className="history-timeline-content">
                        <div className="history-timeline-result">{item.result}</div>
                        <div className="history-timeline-note">{item.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <div className="detail-section-title">球队印象</div>
                <div className="history-impression-grid">
                  <div className="history-impression-card">
                    <div className="history-impression-label">关键词</div>
                    <div className="history-impression-value">{buildKeywords(activeHistoryTeam)}</div>
                  </div>
                  <div className="history-impression-card">
                    <div className="history-impression-label">历史定位</div>
                    <div className="history-impression-value">{buildLegacy(activeHistoryTeam)}</div>
                  </div>
                  <div className="history-impression-card">
                    <div className="history-impression-label">当前 Elo 排名</div>
                    <div className="history-impression-value">
                      {activeHistoryTeam.currentEloRank ? `第 ${activeHistoryTeam.currentEloRank} 位` : "暂无"}
                    </div>
                  </div>
                  <div className="history-impression-card">
                    <div className="history-impression-label">历史 Elo 样本</div>
                    <div className="history-impression-value">
                      {activeHistoryTeam.historyMatchCount ? `${activeHistoryTeam.historyMatchCount} 场记录` : "资料待补充"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </aside>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <div className={cn("toast", toast.visible && "show")}>{toast.text}</div>
    </main>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function buildSimulatedStandings(baseTeams, matches) {
  const table = new Map(baseTeams.map((team) => [team.name, { ...team }]));

  matches.forEach((match) => {
    const homeScore = Number(match.homeScore);
    const awayScore = Number(match.awayScore);
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return;

    const home = table.get(match.home.name);
    const away = table.get(match.away.name);
    if (!home || !away) return;

    home.p += 1; away.p += 1;
    home.gf += homeScore; home.ga += awayScore;
    away.gf += awayScore; away.ga += homeScore;

    if (homeScore > awayScore) {
      home.w += 1; away.l += 1; home.pts += 3;
    } else if (homeScore < awayScore) {
      away.w += 1; home.l += 1; away.pts += 3;
    } else {
      home.d += 1; away.d += 1; home.pts += 1; away.pts += 1;
    }
  });

  return [...table.values()]
    .map((team) => ({ ...team, gd: team.gf - team.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name))
    .map((team, index, list) => ({
      ...team,
      pos: index + 1,
      tone: index === 0 ? "q1" : index === 1 ? "q2" : index === list.length - 1 ? "out danger" : "out",
    }));
}

function EloTrendChart({ team }) {
  const width = 320;
  const height = 164;
  const padding = 18;
  const values = team.points.map((point) => point.elo);
  const min = Math.min(...values) - 10;
  const max = Math.max(...values) + 10;
  const stepX = (width - padding * 2) / Math.max(team.points.length - 1, 1);

  const coordinates = team.points.map((point, index) => {
    const x = padding + stepX * index;
    const y = height - padding - ((point.elo - min) / Math.max(max - min, 1)) * (height - padding * 2);
    return { ...point, x, y };
  });

  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="trend-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" aria-label={`${team.name} Elo 走势`}>
        <defs>
          <linearGradient id={`trend-fill-${team.id}`} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor={team.color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={team.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((index) => {
          const y = padding + ((height - padding * 2) / 2) * index;
          return <line key={index} x1={padding} y1={y} x2={width - padding} y2={y} className="trend-grid-line" />;
        })}
        <path
          d={`${path} L ${coordinates[coordinates.length - 1].x.toFixed(2)} ${height - padding} L ${coordinates[0].x.toFixed(2)} ${height - padding} Z`}
          fill={`url(#trend-fill-${team.id})`}
        />
        <path d={path} fill="none" stroke={team.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point) => (
          <g key={`${team.id}-${point.label}`}>
            <circle cx={point.x} cy={point.y} r="4.5" fill={team.color} />
            <circle cx={point.x} cy={point.y} r="2" fill="#070b0f" />
          </g>
        ))}
      </svg>
      <div className="trend-x-axis">
        {team.points.map((point) => (
          <span key={`${team.id}-${point.label}`}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function buildKeywords(team) {
  if (team.id === "brazil")    return "技术、天赋、进攻传承";
  if (team.id === "germany")   return "体系、纪律、大赛执行力";
  if (team.id === "argentina") return "球星、韧性、关键战表现";
  if (team.id === "france")    return "天赋深度、速度、爆发力";
  if (team.id === "spain")     return "控球、中场、节奏掌控";
  if (team.id === "england")   return "身体对抗、年轻化、边路火力";
  if (team.id === "italy")     return "防守、经验、淘汰赛气质";
  return "传统、竞争力、世界杯底蕴";
}

function buildLegacy(team) {
  if (Number(team.titles) >= 4) return "顶级历史豪门，任何时代都具备冠军叙事。";
  if (Number(team.titles) >= 2) return "稳定的世界级强队，具备完整冠军周期。";
  return "拥有鲜明黄金时代或独特战术印记的世界强队。";
}

function enrichHistoryTeam(team, eloRankings, historyIndexByName) {
  const englishNameMap = {
    brazil: "Brazil", germany: "Germany", argentina: "Argentina",
    france: "France", spain: "Spain", england: "England",
    italy: "Italy", uruguay: "Uruguay", netherlands: "Netherlands",
    croatia: "Croatia", mexico: "Mexico",
  };
  const originalName = englishNameMap[team.id];
  const eloRow = eloRankings.find((item) => item.originalName === originalName);
  const historyMeta = (originalName && historyIndexByName[originalName]) || historyIndexByName[team.name] || null;
  return {
    ...team,
    currentElo: eloRow?.elo ?? null,
    currentEloRank: eloRow?.rank ?? null,
    historyMatchCount: historyMeta?.matchCount ?? null,
  };
}

function buildAdaptiveSimulatorScenarios(currentStandings, groupedFixtures, fallbackScenarios) {
  if (!currentStandings?.length) return fallbackScenarios;

  return currentStandings.map((group) => {
    const fallback = fallbackScenarios.find((scenario) => scenario.group === group.group);
    const realGroupFixtures = groupedFixtures?.find((item) => item.label === group.group)?.matches || [];
    const rows = group.rows.slice(0, 4).map((row) => ({
      name: row.name, flag: row.flag,
      p: row.p, w: row.w, d: row.d, l: row.l,
      gf: row.gf ?? 0, ga: row.ga ?? 0, pts: row.pts,
    }));

    const realFinalRoundMatches =
      realGroupFixtures.length >= 2
        ? [...realGroupFixtures]
            .sort((l, r) => new Date(l.startingAt || 0).getTime() - new Date(r.startingAt || 0).getTime())
            .slice(-2)
            .map((fixture) => ({
              id: `sim-${fixture.id}`,
              home: { name: fixture.home.name, flag: fixture.home.flag },
              away: { name: fixture.away.name, flag: fixture.away.flag },
              homeScore: typeof fixture.homeScore === "number" ? fixture.homeScore : 1,
              awayScore: typeof fixture.awayScore === "number" ? fixture.awayScore : 0,
            }))
        : null;

    const defaultMatches =
      realFinalRoundMatches ||
      fallback?.matches ||
      [
        {
          id: `${group.group}-m1`,
          home: { name: rows[0]?.name || "主队", flag: rows[0]?.flag || "🏳️" },
          away: { name: rows[3]?.name || "客队", flag: rows[3]?.flag || "🏳️" },
          homeScore: 1, awayScore: 0,
        },
        {
          id: `${group.group}-m2`,
          home: { name: rows[1]?.name || "主队", flag: rows[1]?.flag || "🏳️" },
          away: { name: rows[2]?.name || "客队", flag: rows[2]?.flag || "🏳️" },
          homeScore: 1, awayScore: 1,
        },
      ];

    return {
      group: group.group,
      note:
        realFinalRoundMatches?.length === 2
          ? "基于该组末轮两场真实对阵，输入假设比分后实时重算出线顺位。"
          : fallback?.note || simulatorFallbackNote,
      teams: rows,
      matches: defaultMatches,
    };
  });
}
