"use client";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { useElo } from "@/lib/hooks/useElo";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { useTopScorers } from "@/lib/hooks/useTopScorers";
import { usePolymarket } from "@/lib/hooks/usePolymarket";
import OddsTicker from "@/components/shared/OddsTicker";
import MatchCard from "@/components/shared/MatchCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TopBar from "@/components/shared/TopBar";
import { PlayerProvider, useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";

const COMP_LABELS = { wc2026: "2026 WC" };
const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_STYLES = [
  { border: "1px solid var(--gold)", bg: "var(--gold-dim)", pctColor: "var(--gold)" },
  { border: "1px solid rgba(192,192,192,0.4)", bg: "rgba(192,192,192,0.05)", pctColor: "#bdbdbd" },
  { border: "1px solid rgba(205,127,50,0.4)", bg: "rgba(205,127,50,0.05)", pctColor: "#cd7f32" },
];
const RANK_LABELS = ["4th", "5th", "6th"];

function LiveBanner({ fixture }) {
  if (!fixture) return null;
  return (
    <div style={{
      margin: "0 12px 12px",
      background: "linear-gradient(135deg, #1a1f2e, #151922)",
      border: "1px solid rgba(255,61,61,0.25)",
      borderRadius: "var(--radius)", padding: "10px 12px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--live)", animation: "pulse 1.5s infinite", flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "0 10px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--live)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {fixture.stage || fixture.group || "世界杯"} ÷ {fixture.minute || "—"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>
          {fixture.home?.flag} {fixture.home?.name} vs {fixture.away?.flag} {fixture.away?.name}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: 20, fontWeight: 900, color: "var(--text)",
          letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", textAlign: "right",
        }}>
          {fixture.homeScore ?? 0}–{fixture.awayScore ?? 0}
        </div>
        <div style={{ fontSize: 10, color: "var(--live)", fontWeight: 700, textAlign: "right", marginTop: 2 }}>
          {fixture.minute || "—"}
        </div>
      </div>
    </div>
  );
}


function TournamentProgress({ fixturesData }) {
  const allFixtures = fixturesData?.fixtures || [];
  const total = allFixtures.length || 104; // 2026 WC = 104 matches
  const played = allFixtures.filter(f => f.status === "FT").length;
  const live = allFixtures.filter(f => f.status === "LIVE").length;
  const pct = total > 0 ? ((played + live) / total * 100) : 0;

  if (played === 0 && live === 0) return null;

  return (
    <div style={{
      margin: "0 12px 14px", background: "var(--card)",
      border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
      padding: "10px 12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          赛事进度
        </span>
        <span style={{ fontSize: 10, color: "var(--text3)", fontVariantNumeric: "tabular-nums" }}>
          {played}{live > 0 ? `+${live}` : ""}/{total} 场
        </span>
      </div>
      <div style={{ height: 6, background: "var(--card2)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg, var(--green), var(--blue))",
          width: `${pct}%`, transition: "width 0.5s",
        }} />
      </div>
    </div>
  );
}

function TopScorersCard({ comp }) {
  const { data } = useTopScorers();
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();
  const router = useRouter();
  const scorers = (data?.scorers || []).slice(0, 3);
  if (scorers.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{
      margin: "0 12px 12px", background: "var(--card)",
      border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          射手榜
        </span>
        <Link href={`/${comp}/scorers`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>完整榜 →</Link>
      </div>
      {scorers.map((s, i) => (
        <div key={s.player || i} style={{
          display: "flex", alignItems: "center", padding: "7px 12px", gap: 8,
          borderTop: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 14, width: 20 }}>{medals[i]}</span>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{s.flag || "🏴"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div onClick={() => {
              const histId = lookup(s.playerNameEn || s.player);
              const id = histId || s.playerId;
              if (id) openPlayer(id, s.player, histId);
            }} style={{
              fontSize: 12, fontWeight: 700, color: "var(--text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              cursor: "pointer",
            }}>{s.player}</div>
            <div onClick={() => router.push(`/team/${encodeURIComponent(s.teamOriginalName || s.team)}`)} style={{ fontSize: 9, color: "var(--text3)", cursor: "pointer" }}>{s.team}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "var(--gold)", fontVariantNumeric: "tabular-nums" }}>
              {s.goals}
            </span>
            <span style={{ fontSize: 9, color: "var(--text3)", marginLeft: 2 }}>球</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function todayFixtures(fixtures) {
  if (!fixtures?.length) return [];
  const todayBJT = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
  return fixtures.filter(f => {
    if (!f.startingAt) return false;
    const fDateBJT = new Date(f.startingAt).toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
    return fDateBJT === todayBJT;
  });
}

export default function CompHomePage() {
  return (
    <PlayerProvider>
      <CompHomePageInner />
    </PlayerProvider>
  );
}

function CompHomePageInner() {
  const { comp } = useParams();

  const { data: fixturesData, loading: fixturesLoading } = useFixtures({ pollInterval: 30000 });
  const { data: eloData } = useElo();
  const { data: predData } = usePredictions();
  const { data: polyData } = usePolymarket();
  // Helper: resolve English originalName for team detail navigation
  const getTeamHref = (team) => {
    const eloTeam = (eloData?.rankings || []).find(
      r => r.code === team.code || r.name === team.name
    );
    return `/team/${encodeURIComponent(eloTeam?.originalName || team.originalName || team.name)}`;
  };

  const liveFixtures = fixturesData?.fixtures?.filter(f => f.status === "LIVE") || [];
  const todayList    = todayFixtures(fixturesData?.fixtures || []);
  const upcomingList = useMemo(() => {
    if (todayList.length > 0) return [];
    const now = new Date();
    return (fixturesData?.fixtures || [])
      .filter(f => f.startingAt && new Date(f.startingAt) > now)
      .sort((a, b) => new Date(a.startingAt) - new Date(b.startingAt))
      .slice(0, 3);
  }, [todayList, fixturesData]);
  const displayFixtures  = todayList.length > 0 ? todayList : upcomingList;
  const fixtureLabel     = todayList.length > 0 ? "今日赛程" : "最近赛程";
  const top6       = (predData?.teams || []).filter(t => !t.placeholder).slice(0, 6);
  const top3       = top6.slice(0, 3);
  const next3      = top6.slice(3, 6);

  return (
    <div>
      <TopBar comp={comp} badge />

      {liveFixtures.length > 0 && <LiveBanner fixture={liveFixtures[0]} />}

      <OddsTicker polyData={polyData} />
      <TournamentProgress fixturesData={fixturesData} />

      <div style={{ padding: "0 12px", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{fixtureLabel}</span>
        <Link href={`/${comp}/fixtures`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>全部 →</Link>
      </div>
      {fixturesLoading ? (
        <LoadingSpinner />
      ) : displayFixtures.length === 0 ? (
        <p style={{ padding: "0 12px", color: "var(--text2)", fontSize: 13 }}>暂无赛程数据</p>
      ) : (
        displayFixtures.map(f => <MatchCard key={f.id} fixture={f} predictions={predData?.teams} showVenue />)
      )}

      {/* ELO Top 6 */}
      {top3.length > 0 && (
        <div style={{
          margin: "0 12px 12px", background: "var(--card)",
          border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              夺冠热门 · ELO模型
            </span>
            <Link href={`/${comp}/predict`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>完整榜 →</Link>
          </div>
          <div style={{ display: "flex", padding: "10px 8px 8px", gap: 6 }}>
            {top3.map((team, i) => (
              <Link key={team.code} href={getTeamHref(team)} style={{
                flex: 1, background: MEDAL_STYLES[i].bg, border: MEDAL_STYLES[i].border,
                borderRadius: "var(--radius-sm)", padding: 8, textAlign: "center",
                textDecoration: "none", display: "block",
              }}>
                <div style={{ fontSize: 14 }}>{MEDALS[i]}</div>
                <span style={{ fontSize: 20, display: "block", margin: "4px 0" }}>{team.flag}</span>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{team.name}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: MEDAL_STYLES[i].pctColor, marginTop: 2 }}>
                  {team.probabilityValue !== undefined ? `${team.probabilityValue.toFixed(1)}%` : "—"}
                </div>
              </Link>
            ))}
          </div>
          {next3.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "4px 8px 10px" }}>
              {next3.map((team, i) => (
                <Link key={team.code} href={getTeamHref(team)} style={{
                  display: "flex", alignItems: "center", padding: "6px 4px", gap: 8,
                  borderBottom: i < next3.length - 1 ? "1px solid var(--border)" : "none",
                  textDecoration: "none",
                }}>
                  <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, width: 16, textAlign: "center", flexShrink: 0 }}>{i + 4}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{team.flag}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", flex: 1 }}>{team.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", fontVariantNumeric: "tabular-nums" }}>
                    {team.probabilityValue !== undefined ? `${team.probabilityValue.toFixed(1)}%` : "—"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <TopScorersCard comp={comp} />

      <div style={{ height: 20 }} />
    </div>
  );
}
