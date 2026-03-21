"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMatchDetail } from "@/lib/hooks/useMatchDetail";
import { useH2H } from "@/lib/hooks/useH2H";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { useTeamStrengths, findTeamStrength } from "@/lib/hooks/useTeamStrengths";
import { computeMatchOdds, computeLambda, eloToLambda, getHostAdvantage, hybridLambda, computeInPlayOdds } from "@/lib/poisson";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { nameToIso } from "@/lib/canonical-names";
import { PlayerProvider, useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";

import ScoreHeader from "./components/ScoreHeader";
import GoalScorers from "./components/GoalScorers";
import TabOverview from "./components/TabOverview";
import TabAnalysis from "./components/TabAnalysis";
import TabLineups from "./components/TabLineups";
import TabStats from "./components/TabStats";
import TabEvents from "./components/TabEvents";

/* ── Tabs ───────────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "概况" },
  { id: "analysis", label: "分析" },
  { id: "lineups",  label: "阵容" },
  { id: "stats",    label: "统计" },
  { id: "events",   label: "事件" },
];

/* ── Main Page ───────────────────────────────────────── */
export default function MatchDetailPage() {
  return (
    <PlayerProvider>
      <MatchDetailInner />
    </PlayerProvider>
  );
}

function MatchDetailInner() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const { data, loading } = useMatchDetail(id);
  const [tab, setTab] = useState("overview");
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();
  const handleEventPlayerClick = (name) => {
    const histId = lookup(name);
    if (histId) openPlayer(histId, name);
  };

  const fixture = data?.fixture;
  const homeIso = useMemo(() => fixture ? nameToIso(fixture.home.originalName) : null, [fixture]);
  const awayIso = useMemo(() => fixture ? nameToIso(fixture.away.originalName) : null, [fixture]);

  // Pre-match data: predictions + H2H + team strengths (only fetch when NS)
  const isNS = fixture?.status === "NS";
  const { data: predictionsData } = usePredictions();
  const { data: h2hData } = useH2H(isNS ? homeIso : null, isNS ? awayIso : null);
  const { data: strengthsData } = useTeamStrengths();

  // Compute Poisson odds from team strengths (our proprietary model)
  // Also compute for LIVE matches to enable in-play probability updates
  const poissonOdds = useMemo(() => {
    if (!fixture || (fixture.status !== "NS" && fixture.status !== "LIVE")) return null;

    // Lookup team strength data (SportMonks statistics)
    const homeStr = findTeamStrength(strengthsData, fixture.home.originalName);
    const awayStr = findTeamStrength(strengthsData, fixture.away.originalName);

    // Lookup ELO ratings (predictions.json uses Chinese names matching fixture.home.name)
    const homePred = predictionsData?.teams?.find(t =>
      t.name === fixture.home.name || t.code === homeIso?.toUpperCase()
    );
    const awayPred = predictionsData?.teams?.find(t =>
      t.name === fixture.away.name || t.code === awayIso?.toUpperCase()
    );

    // Host advantage from venue
    const { homeBoost, awayBoost } = getHostAdvantage(
      fixture.home.originalName, fixture.away.originalName, fixture.venue
    );

    // Best: Hybrid model (strength + ELO blend)
    if (homeStr && awayStr && homePred?.elo && awayPred?.elo) {
      const lambdas = hybridLambda(
        homeStr.attack, homeStr.defense,
        awayStr.attack, awayStr.defense,
        homePred.elo, awayPred.elo,
        { avgGoals: 3.0, homeBoost, awayBoost }
      );
      return computeMatchOdds(lambdas.home, lambdas.away);
    }

    // Fallback A: strength only (no ELO available)
    if (homeStr && awayStr) {
      const lambdas = computeLambda(
        homeStr.attack, homeStr.defense,
        awayStr.attack, awayStr.defense,
        { avgGoals: 3.0, homeBoost, awayBoost }
      );
      return computeMatchOdds(lambdas.home, lambdas.away);
    }

    // Fallback B: ELO only (no strength data — uses conservative defaults)
    if (homePred?.elo && awayPred?.elo) {
      const lambdas = eloToLambda(homePred.elo, awayPred.elo);
      lambdas.home *= homeBoost;
      lambdas.away *= awayBoost;
      return computeMatchOdds(lambdas.home, lambdas.away);
    }

    return null;
  }, [fixture, strengthsData, predictionsData, homeIso, awayIso]);

  // Live in-play odds: recalculate based on current score + minute
  const liveOdds = useMemo(() => {
    if (!fixture || fixture.status !== "LIVE" || !poissonOdds) return null;
    const minute = parseInt(fixture.minute) || 0;
    if (minute <= 0) return null;
    return computeInPlayOdds(
      poissonOdds.lambdaHome,
      poissonOdds.lambdaAway,
      minute,
      fixture.homeScore ?? 0,
      fixture.awayScore ?? 0,
    );
  }, [fixture, poissonOdds]);

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", height: "100dvh", background: "var(--bg)",
      overflowY: "auto", WebkitOverflowScrolling: "touch",
    }}>
      {loading && !fixture && <LoadingSpinner />}

      {fixture && (
        <>
          <ScoreHeader fixture={fixture} onBack={() => router.back()} onTeamClick={(team) => router.push(`/team/${encodeURIComponent(team.originalName || team.name)}`)} />

          {/* Goal scorers */}
          <GoalScorers events={data.events} fixture={fixture} onPlayerClick={handleEventPlayerClick} />

          {/* Tabs */}
          <div style={{
            display: "flex", gap: 0, background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
            position: "sticky", top: 0, zIndex: 40,
            overflowX: "auto", WebkitOverflowScrolling: "touch",
          }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, minWidth: 0, textAlign: "center", padding: "10px 0",
                fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                color: tab === t.id ? "var(--blue)" : "var(--text3)",
                borderBottom: tab === t.id ? "2px solid var(--blue)" : "2px solid transparent",
                background: "none", border: "none", cursor: "pointer",
                letterSpacing: "0.02em",
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ paddingBottom: 80 }}>
            {tab === "overview" && <TabOverview data={data} onPlayerClick={handleEventPlayerClick} predictionsTeams={predictionsData?.teams} h2hData={h2hData} homeIso={homeIso} awayIso={awayIso} poissonOdds={poissonOdds} liveOdds={liveOdds} onSwitchTab={setTab} />}
            {tab === "analysis" && <TabAnalysis data={data} poissonOdds={poissonOdds} fixture={fixture} />}
            {tab === "lineups" && <TabLineups data={data} />}
            {tab === "stats" && <TabStats data={data} />}
            {tab === "events" && <TabEvents data={data} onPlayerClick={handleEventPlayerClick} />}
          </div>
        </>
      )}
    </div>
  );
}
