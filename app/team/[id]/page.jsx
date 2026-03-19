"use client";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useElo } from "@/lib/hooks/useElo";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { useTeamHistory } from "@/lib/hooks/useTeamHistory";
import { useSquad } from "@/lib/hooks/useSquad";
import { useEloTrends } from "@/lib/hooks/useEloTrends";
import MatchCard from "@/components/shared/MatchCard";
import EloSparkline from "@/components/shared/EloSparkline";
import SectionTitle from "@/components/ui/SectionTitle";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft } from "lucide-react";
import { POSITION_LABEL } from "@/lib/utils/teamIso";

const POSITION_ORDER = ["GK", "DF", "MF", "FW"];

const BEST_RESULT_ZH = {
  "winners":        "🏆 冠军",
  "runners-up":     "🥈 亚军",
  "third place":    "🥉 季军",
  "fourth place":   "第4名",
  "quarter-finals": "八强",
  "round of 16":    "十六强",
  "group stage":    "小组赛出局",
};

function bestResultLabel(result) {
  return BEST_RESULT_ZH[result?.toLowerCase()] || result || "-";
}

// ── Group badge ────────────────────────────────────────────────────────────────
function useTeamGroup(teamOriginalName) {
  const [group, setGroup] = useState(null);
  useEffect(() => {
    if (!teamOriginalName) return;
    fetch("/data/wc2026-groups.json")
      .then((r) => r.json())
      .then((d) => {
        for (const [letter, teams] of Object.entries(d)) {
          // match by English name (e.g. "Korea Republic") or display variant
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

// ── Recent form (last 5 finished fixtures) ────────────────────────────────────
function formBadge(fixture, teamOriginalName) {
  const { home, away, score } = fixture;
  if (!score || score.home == null || score.away == null) return null;

  const isHome = home.originalName === teamOriginalName || home.name === teamOriginalName;
  const teamScore = isHome ? score.home : score.away;
  const oppScore  = isHome ? score.away : score.home;

  if (teamScore > oppScore) return "W";
  if (teamScore < oppScore) return "L";
  return "D";
}

const FORM_COLOR = {
  W: { bg: "var(--green, #22c55e)", text: "#fff" },
  D: { bg: "var(--text3, #6b7280)", text: "#fff" },
  L: { bg: "var(--red, #ef4444)",   text: "#fff" },
};

function FormStrip({ fixtures, teamOriginalName }) {
  const finished = fixtures
    .filter((f) => f.status === "FT" || f.status === "AET" || f.status === "PEN")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .reverse();

  if (finished.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
      {finished.map((f, i) => {
        const result = formBadge(f, teamOriginalName);
        if (!result) return null;
        const { bg, text } = FORM_COLOR[result];
        return (
          <div
            key={f.id || i}
            title={`${f.home.name} ${f.score?.home}-${f.score?.away} ${f.away.name}`}
            style={{
              width: 22, height: 22, borderRadius: 4,
              background: bg, color: text,
              fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {result}
          </div>
        );
      })}
    </div>
  );
}

// ── WC History card ────────────────────────────────────────────────────────────
function WcHistoryCard({ history }) {
  if (!history) return null;
  const { appearances, titles, titleYears, bestResult, history: years } = history;
  const recent = [...(years || [])].reverse().slice(0, 8);

  return (
    <div style={{ margin: "0 16px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
      {/* Summary row */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {[
          { value: appearances ?? 0, label: "届世界杯" },
          { value: titles ?? 0,      label: "次冠军" },
          { value: bestResultLabel(bestResult), label: "最佳成绩", small: true },
        ].map((item, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
            <div style={{ fontSize: item.small ? 11 : 20, fontWeight: 900, color: "var(--blue)", lineHeight: 1.2 }}>
              {item.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Title years */}
      {titleYears?.length > 0 && (
        <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-dim)" }}>
          夺冠年份：
          <span style={{ color: "var(--blue)", fontWeight: 700 }}>
            {titleYears.join("、")}
          </span>
        </div>
      )}

      {/* Recent WC records */}
      {recent.length > 0 && (
        <div>
          {recent.map((entry, i) => (
            <div key={entry.year} style={{
              display: "flex", alignItems: "center", padding: "7px 12px", gap: 10,
              borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", minWidth: 36 }}>{entry.year}</span>
              <span style={{ fontSize: 11, flex: 1, color: "var(--text)" }}>{bestResultLabel(entry.result)}</span>
              <span style={{ fontSize: 10, color: "var(--text-dim)", fontVariantNumeric: "tabular-nums" }}>
                {entry.wins}胜 {entry.draws}平 {entry.losses}负
              </span>
              <span style={{ fontSize: 10, color: "var(--text-dim)", minWidth: 32, textAlign: "right" }}>
                {entry.gf}-{entry.ga}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Squad section ──────────────────────────────────────────────────────────────
function SquadSection({ squad }) {
  if (!squad) return null;
  const { players } = squad;
  if (!players?.length) return null;

  const byPosition = {};
  for (const pos of POSITION_ORDER) byPosition[pos] = [];
  for (const p of players) {
    if (byPosition[p.position]) byPosition[p.position].push(p);
    else byPosition["FW"] = [...(byPosition["FW"] || []), p];
  }

  return (
    <div style={{ margin: "0 16px 16px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      {POSITION_ORDER.filter(pos => byPosition[pos]?.length > 0).map((pos, pi) => (
        <div key={pos}>
          <div style={{
            padding: "5px 12px",
            fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
            color: "var(--text-dim)", background: "var(--card2)",
            borderTop: pi > 0 ? "1px solid var(--border)" : "none",
          }}>
            {POSITION_LABEL[pos]}（{byPosition[pos].length}人）
          </div>
          {byPosition[pos].map((p, i) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", padding: "7px 12px", gap: 10,
              borderBottom: i < byPosition[pos].length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "var(--text-dim)",
                width: 20, textAlign: "center", fontVariantNumeric: "tabular-nums",
              }}>
                {p.shirtNumber ?? "—"}
              </span>
              <span style={{ fontSize: 12, flex: 1, color: "var(--text)" }}>{p.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { id } = useParams();
  const teamName = decodeURIComponent(Array.isArray(id) ? id[0] : id);
  const router = useRouter();

  const { data: eloData,      loading: eloLoading      } = useElo();
  const { data: fixturesData, loading: fixturesLoading } = useFixtures();
  const { data: historyData                             } = useTeamHistory(teamName);
  const { data: squadData                               } = useSquad(teamName);
  const { trendMap                                      } = useEloTrends();

  const teamElo = useMemo(() =>
    (eloData?.rankings || []).find(
      (r) => r.originalName === teamName || r.name === teamName || r.code === teamName
    ),
    [eloData, teamName]
  );

  // Look up group using the original English name from ELO data (more reliable)
  const lookupName = teamElo?.originalName || teamName;
  const group = useTeamGroup(lookupName);

  const teamFixtures = useMemo(() =>
    (fixturesData?.fixtures || []).filter(
      (f) =>
        f.home.originalName === teamName || f.away.originalName === teamName ||
        f.home.name === teamName         || f.away.name === teamName
    ),
    [fixturesData, teamName]
  );

  const trendPoints = trendMap
    ? (trendMap[teamName] || trendMap[teamElo?.originalName] || null)
    : null;

  const flag        = teamElo?.flag || "🏴";
  const displayName = teamElo?.name || teamName;

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

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      {eloLoading ? <LoadingSpinner /> : (
        <>
          {/* Hero */}
          <div style={{
            padding: "20px 16px 16px", display: "flex", alignItems: "flex-start", gap: 16,
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 52, lineHeight: 1 }}>{flag}</span>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name + group badge */}
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

              {/* ELO + rank */}
              {teamElo && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  <span style={{ fontSize: 12, color: "var(--text-dim)" }}>ELO</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>
                    {teamElo.elo}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                    全球第 {teamElo.rank} 名
                  </span>
                </div>
              )}

              {/* ELO sparkline */}
              {trendPoints && trendPoints.length > 1 && (
                <div style={{ marginTop: 6 }}>
                  <EloSparkline data={trendPoints.slice(-7)} width={80} height={28} />
                </div>
              )}

              {/* Recent form strip */}
              {!fixturesLoading && (
                <FormStrip fixtures={teamFixtures} teamOriginalName={teamName} />
              )}
            </div>
          </div>

          {/* WC History */}
          {historyData && (
            <section>
              <SectionTitle>世界杯历史</SectionTitle>
              <WcHistoryCard history={historyData} />
            </section>
          )}

          {/* Fixtures */}
          <section>
            <SectionTitle>赛程 &amp; 战绩</SectionTitle>
            {fixturesLoading ? <LoadingSpinner /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
                {teamFixtures.length === 0 ? (
                  <p style={{ color: "var(--text-dim)", fontSize: 14 }}>暂无赛程数据</p>
                ) : (
                  teamFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)
                )}
              </div>
            )}
          </section>

          {/* Squad */}
          {squadData && (
            <section style={{ marginTop: 8 }}>
              <SectionTitle>
                大名单
                {squadData.players?.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-dim)", marginLeft: 6 }}>
                    ({squadData.players.length}人)
                  </span>
                )}
              </SectionTitle>
              <SquadSection squad={squadData} />
            </section>
          )}
        </>
      )}
      </div>
    </div>
  );
}
