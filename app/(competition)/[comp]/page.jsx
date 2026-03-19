"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useElo } from "@/lib/hooks/useElo";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { usePredictions } from "@/lib/hooks/usePredictions";
import MatchCard from "@/components/shared/MatchCard";
import TeamSearchModal from "@/components/shared/TeamSearchModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SectionTitle from "@/components/ui/SectionTitle";

// Beijing time date-string helper
function toBeijingDateStr(isoString) {
  return new Date(isoString).toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "short",
    day:   "numeric",
    weekday: "short",
  });
}

// ── Days-until countdown ──────────────────────────────────────────────────────
const TOURNAMENT_START = new Date("2026-06-11T00:00:00-05:00"); // ~US Central opening ceremony

function DaysUntilBanner() {
  const now      = new Date();
  const diffMs   = TOURNAMENT_START - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return (
      <div style={{
        margin: "10px 12px", padding: "10px 14px",
        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>🔴</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--red, #ef4444)" }}>
          世界杯正在进行中
        </span>
      </div>
    );
  }

  return (
    <div style={{
      margin: "10px 12px", padding: "10px 14px",
      background: "var(--card)", border: "1px solid var(--border2)",
      borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          距开幕
        </span>
        <span style={{ fontSize: 10, color: "var(--text3)" }}>2026.6.11 开幕 · 墨西哥城</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>
          {diffDays}
        </span>
        <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>天</span>
      </div>
    </div>
  );
}

// ── Top predictions widget ────────────────────────────────────────────────────
function TopPredictions({ teams, onTeamClick }) {
  const top6 = (teams || []).slice(0, 6);
  const maxProb = top6[0]?.probabilityValue || 1;

  if (top6.length === 0) return null;

  return (
    <div style={{ margin: "0 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
      <div style={{ padding: "10px 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", color: "var(--text2)" }}>
          夺冠热门
        </span>
        <span style={{ fontSize: 10, color: "var(--text3)" }}>ELO 蒙特卡洛模型</span>
      </div>

      {top6.map((team, i) => {
        const pct      = team.probabilityValue || 0;
        const barWidth = maxProb > 0 ? (pct / maxProb) * 100 : 0;

        return (
          <button
            key={team.name}
            onClick={() => onTeamClick(team)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px",
              borderTop: i === 0 ? "1px solid var(--border)" : "none",
              borderBottom: i < top6.length - 1 ? "1px solid var(--border)" : "none",
              background: "none", border: "none", borderTop: "1px solid var(--border)",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 10, color: "var(--text3)", width: 14, fontWeight: 700, flexShrink: 0 }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{team.flag}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", flex: 1, textAlign: "left" }}>
              {team.name}
            </span>
            <div style={{
              width: 60, height: 3, background: "var(--card2)",
              borderRadius: 999, overflow: "hidden", flexShrink: 0,
            }}>
              <div style={{
                width: `${barWidth}%`, height: "100%", borderRadius: 999,
                background: "linear-gradient(90deg, var(--blue), var(--purple))",
              }} />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 900, color: "var(--text)",
              width: 42, textAlign: "right",
              fontVariantNumeric: "tabular-nums", flexShrink: 0,
            }}>
              {pct.toFixed(1)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { comp } = useParams();
  const router = useRouter();

  const [showSearch, setShowSearch] = useState(false);

  const { data: eloData,   loading: eloLoading  } = useElo();
  const { data: predData,  loading: predLoading  } = usePredictions();
  const { data: fixturesData, loading: fixLoading } = useFixtures();

  const allTeams  = eloData?.rankings   || [];
  const wcTeams   = (predData?.teams || []).sort((a, b) => (b.probabilityValue || 0) - (a.probabilityValue || 0));

  // Upcoming / live matches — show next 5
  const upcomingFixtures = useMemo(() => {
    const all = fixturesData?.fixtures || [];
    const now  = new Date();
    return all
      .filter((f) => f.status === "NS" || f.status === "LIVE" || f.status === "HT")
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [fixturesData]);

  // Recent results — last 3 finished matches
  const recentResults = useMemo(() => {
    const all = fixturesData?.fixtures || [];
    return all
      .filter((f) => f.status === "FT" || f.status === "AET" || f.status === "PEN")
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [fixturesData]);

  function handleTeamClick(team) {
    router.push(`/team/${encodeURIComponent(team.originalName || team.name)}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* TopBar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px 8px", flexShrink: 0,
      }}>
        <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
          DJ<span style={{ color: "var(--blue)" }}>YY</span>
        </span>

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--card)", border: "1px solid var(--border2)",
          borderRadius: 999, padding: "3px 10px 3px 6px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>2026 WC</span>
          <span style={{ fontSize: 8, color: "var(--text3)" }}>▾</span>
        </div>

        {/* Search button — wired to TeamSearchModal */}
        <button
          onClick={() => setShowSearch(true)}
          style={{
            width: 32, height: 32, background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, cursor: "pointer",
          }}
        >
          🔍
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", flex: 1, paddingBottom: 24 }}>
        {/* Countdown banner */}
        <DaysUntilBanner />

        {/* Top predictions */}
        {(eloLoading || predLoading) ? (
          <LoadingSpinner />
        ) : (
          <section>
            <SectionTitle style={{ padding: "14px 12px 8px" }}>夺冠热门</SectionTitle>
            <TopPredictions teams={wcTeams} onTeamClick={handleTeamClick} />
          </section>
        )}

        {/* Upcoming fixtures */}
        {upcomingFixtures.length > 0 && (
          <section style={{ marginTop: 20 }}>
            <SectionTitle style={{ padding: "0 12px 8px" }}>即将开赛</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 12px" }}>
              {fixLoading ? <LoadingSpinner /> : (
                upcomingFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)
              )}
            </div>
          </section>
        )}

        {/* Recent results */}
        {recentResults.length > 0 && (
          <section style={{ marginTop: 20 }}>
            <SectionTitle style={{ padding: "0 12px 8px" }}>最近战绩</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 12px" }}>
              {recentResults.map((f) => <MatchCard key={f.id} fixture={f} />)}
            </div>
          </section>
        )}

        {/* ELO standings teaser */}
        {!eloLoading && allTeams.length > 0 && (
          <section style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px 8px" }}>
              <SectionTitle>ELO 排名</SectionTitle>
              <button
                onClick={() => setShowSearch(true)}
                style={{
                  fontSize: 11, color: "var(--blue)", fontWeight: 700,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                搜索球队 →
              </button>
            </div>
            <div style={{ margin: "0 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
              {allTeams.slice(0, 8).map((team, i) => (
                <button
                  key={team.name}
                  onClick={() => handleTeamClick(team)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px",
                    borderBottom: i < 7 ? "1px solid var(--border)" : "none",
                    background: "none", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text3)", width: 18, fontWeight: 700, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {team.rank}
                  </span>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{team.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", flex: 1, textAlign: "left" }}>
                    {team.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {team.elo}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Search overlay */}
      {showSearch && (
        <TeamSearchModal
          teams={allTeams}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
