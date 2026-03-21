"use client";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useElo } from "@/lib/hooks/useElo";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { usePolymarket } from "@/lib/hooks/usePolymarket";
import { useTeamHistory } from "@/lib/hooks/useTeamHistory";
import { useSquad } from "@/lib/hooks/useSquad";
import { useTeamDetail } from "@/lib/hooks/useTeamDetail";
import { useEloTrends } from "@/lib/hooks/useEloTrends";
import { EN_TO_ZH } from "@/lib/polymarket-names";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft } from "lucide-react";
import { nameToIso } from "@/lib/utils/teamIso";
import { getTeamMeta } from "@/src/lib/team-meta";
import TeamLogo from "@/components/shared/TeamLogo";
import { PlayerProvider } from "@/components/shared/PlayerContext";

import FormStrip from "./components/RecentForm";
import TabOverview from "./components/TabOverview";
import TabFixtures from "./components/TabFixtures";
import TabHistory from "./components/TabHistory";
import TabSquad from "./components/TabSquad";
import TabStats from "./components/TabStats";

const TABS = ["概览", "赛程", "历史", "阵容", "数据"];

// ── Group badge ────────────────────────────────────────────────────────────────
function useTeamGroup(teamOriginalName) {
  const [group, setGroup] = useState(null);
  useEffect(() => {
    if (!teamOriginalName) return;
    fetch("/data/wc2026-groups.json")
      .then((r) => r.json())
      .then((d) => {
        for (const [letter, teams] of Object.entries(d)) {
          if (teams.some((t) =>
            t === teamOriginalName ||
            t.toLowerCase() === teamOriginalName.toLowerCase()
          )) {
            setGroup(letter);
            return;
          }
        }
      })
      .catch(() => {});
  }, [teamOriginalName]);
  return group;
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function TeamPage() {
  return (
    <PlayerProvider>
      <TeamPageInner />
    </PlayerProvider>
  );
}

function TeamPageInner() {
  const { id } = useParams();
  const teamName = decodeURIComponent(Array.isArray(id) ? id[0] : id);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("概览");

  const { data: eloData,      loading: eloLoading      } = useElo();
  const { data: fixturesData, loading: fixturesLoading } = useFixtures();
  const { data: predData                                } = usePredictions();
  const { data: polyData                                } = usePolymarket();
  const { data: historyData                             } = useTeamHistory(teamName);
  const { data: squadData                               } = useSquad(teamName);
  const { data: teamDetail                              } = useTeamDetail(teamName);
  const { data: eloTrends                               } = useEloTrends();

  const teamElo = useMemo(() => {
    if (!eloData?.rankings) return null;
    const direct = eloData.rankings.find(
      (r) => r.originalName === teamName || r.name === teamName || r.code === teamName
    );
    if (direct) return direct;
    const iso = nameToIso(teamName);
    if (iso) return eloData.rankings.find((r) => r.code === iso) || null;
    const meta = getTeamMeta(teamName);
    if (meta.shortName !== teamName) {
      return eloData.rankings.find((r) => r.name === meta.shortName) || null;
    }
    return null;
  }, [eloData, teamName]);

  const lookupName = teamElo?.originalName || teamName;
  const group = useTeamGroup(lookupName);

  const teamFixtures = useMemo(() => {
    const zhName = teamElo?.name;
    const origName = teamElo?.originalName;
    const names = new Set([teamName]);
    if (zhName) names.add(zhName);
    if (origName) names.add(origName);
    return (fixturesData?.fixtures || []).filter(
      (f) =>
        names.has(f.home.originalName) || names.has(f.away.originalName) ||
        names.has(f.home.name)         || names.has(f.away.name)
    );
  }, [fixturesData, teamName, teamElo]);

  const teamPred = useMemo(() => {
    if (!predData?.teams) return null;
    const dn = teamElo?.name || teamName;
    return predData.teams.find((t) => t.name === dn || t.code === teamElo?.code);
  }, [predData, teamElo, teamName]);

  const marketPct = useMemo(() => {
    if (!polyData?.teams) return null;
    const dn = teamElo?.name || teamName;
    for (const t of polyData.teams) {
      const zh = EN_TO_ZH[t.name];
      if (zh === dn && t.probability > 0) return t.probability;
    }
    return null;
  }, [polyData, teamElo, teamName]);

  const teamGroup = useMemo(() => {
    if (!fixturesData?.standings || !group) return null;
    return fixturesData.standings.find(
      (g) => g.group === `${group} 组` || g.group === `${group}组`
    );
  }, [fixturesData, group]);

  // Group opponents (for H2H + comparison)
  const [groupTeams, setGroupTeams] = useState([]);
  useEffect(() => {
    fetch("/data/wc2026-groups.json")
      .then((r) => r.json())
      .then((d) => {
        const myNames = new Set([teamName]);
        if (teamElo?.originalName) myNames.add(teamElo.originalName);
        if (teamElo?.name) myNames.add(teamElo.name);
        for (const teams of Object.values(d)) {
          if (teams.some((t) => myNames.has(t))) {
            setGroupTeams(teams.filter((t) => !myNames.has(t) && t !== "TBD"));
            return;
          }
        }
      })
      .catch(() => {});
  }, [teamName, teamElo]);

  const teamIso = teamElo?.code || nameToIso(teamName);
  const groupOpponentIsos = useMemo(
    () => groupTeams.map((t) => nameToIso(t)).filter(Boolean),
    [groupTeams]
  );

  const flag        = teamElo?.flag || "🏴";
  const displayName = teamElo?.name || teamName;
  // Try to get team logo from fixtures data (any fixture involving this team)
  const teamLogo = useMemo(() => {
    for (const f of teamFixtures) {
      if (f.home.originalName === lookupName || f.home.name === displayName) return f.home.logo;
      if (f.away.originalName === lookupName || f.away.name === displayName) return f.away.logo;
    }
    return null;
  }, [teamFixtures, lookupName, displayName]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", height: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Topbar */}
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        flexShrink: 0, gap: 8,
      }}>
        <button onClick={() => router.back()} style={{ padding: 4, marginLeft: -4 }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>球队</span>
      </div>

      {eloLoading ? <LoadingSpinner /> : (
        <>
          {/* Hero -- always visible */}
          <div style={{
            padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 14,
            flexShrink: 0,
          }}>
            <TeamLogo logo={teamLogo} flag={flag} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{displayName}</h1>
                {group && (
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    background: "rgba(92,158,255,0.12)", border: "1px solid rgba(92,158,255,0.3)",
                    color: "var(--blue)", borderRadius: 5, padding: "2px 7px",
                    letterSpacing: "0.04em", whiteSpace: "nowrap",
                  }}>
                    {group}组
                  </span>
                )}
              </div>
              {teamElo && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text-dim)" }}>ELO</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{teamElo.elo}</span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)" }}>全球第 {teamElo.rank} 名</span>
                </div>
              )}
              {!fixturesLoading && (
                <FormStrip fixtures={teamFixtures} teamOriginalName={teamName} />
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", flexShrink: 0,
            borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)",
            background: "var(--bg)",
          }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  flex: 1, textAlign: "center", padding: "9px 0",
                  fontSize: 11, fontWeight: 700,
                  color: activeTab === t ? "var(--blue)" : "var(--text3)",
                  borderBottom: activeTab === t ? "2px solid var(--blue)" : "2px solid transparent",
                  background: "none", border: "none", cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content -- scrollable */}
          <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            {activeTab === "概览" && (
              <TabOverview
                teamPred={teamPred}
                marketPct={marketPct}
                teamGroup={teamGroup}
                teamElo={teamElo}
                historyData={historyData}
                teamDetail={teamDetail}
                groupOpponentIsos={groupOpponentIsos}
                eloData={eloData}
                predData={predData}
                eloTrends={eloTrends}
                teamIso={teamIso}
              />
            )}
            {activeTab === "赛程" && (
              <TabFixtures teamFixtures={teamFixtures} fixturesLoading={fixturesLoading} predictions={predData?.teams} />
            )}
            {activeTab === "历史" && (
              <TabHistory historyData={historyData} teamElo={teamElo} teamDetail={teamDetail} />
            )}
            {activeTab === "阵容" && (
              <TabSquad squadData={squadData} teamDetail={teamDetail} />
            )}
            {activeTab === "数据" && (
              <TabStats teamDetail={teamDetail} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
