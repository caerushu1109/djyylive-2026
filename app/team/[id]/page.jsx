"use client";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useElo } from "@/lib/hooks/useElo";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { useTeamHistory } from "@/lib/hooks/useTeamHistory";
import { useSquad } from "@/lib/hooks/useSquad";
import MatchCard from "@/components/shared/MatchCard";
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

// ── ELO History Chart ───────────────────────────────────────────────────────────────
function EloHistoryChart({ originalName, code }) {
  const [points, setPoints] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!originalName || !code) return;
    fetch(`/api/elo-history?name=${encodeURIComponent(originalName)}&code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d) => setPoints(d.points || []))
      .catch(() => setFailed(true));
  }, [originalName, code]);

  if (failed || (points && points.length < 2)) return null;
  if (!points) return (
    <div style={{ height: 80, display: "flex", alignItems: "center",
      justifyContent: "center", color: "var(--text3)", fontSize: 11 }}>
      加载中...
    </div>
  );

  const W = 360, H = 110;
  const PAD = { t: 12, r: 16, b: 22, l: 38 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const elos = points.map((p) => p.elo);
  const minE = Math.min(...elos) - 40;
  const maxE = Math.max(...elos) + 40;
  const WC_YEARS = [2006, 2010, 2014, 2018, 2022, 2026];

  const xp = (yr) => PAD.l + ((yr - 2006) / 20) * cW;
  const yp = (e) => PAD.t + cH - ((e - minE) / (maxE - minE)) * cH;

  const linePoints = points.map((p) => `${xp(p.year)},${yp(p.elo)}`).join(" ");
  const fp = points[0], lp = points[points.length - 1];
  const fillD = `M${xp(fp.year)},${PAD.t + cH} L${xp(fp.year)},${yp(fp.elo)} ` +
    points.slice(1).map((p) => `L${xp(p.year)},${yp(p.elo)}`).join(" ") +
    ` L${xp(lp.year)},${PAD.t + cH}Z`;

  const yStep = Math.round((maxE - minE) / 2 / 50) * 50 || 50;
  const yStart = Math.ceil(minE / yStep) * yStep;
  const yGridLines = [];
  for (let e = yStart; e <= maxE; e += yStep) yGridLines.push(e);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="eloHFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4da6ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4da6ff" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {WC_YEARS.map((yr) => (
        <line key={yr} x1={xp(yr)} y1={PAD.t} x2={xp(yr)} y2={PAD.t + cH}
          stroke="rgba(255,193,7,0.2)" strokeWidth="1" strokeDasharray="2,3" />
      ))}
      {yGridLines.map((e) => (
        <g key={e}>
          <line x1={PAD.l} y1={yp(e)} x2={PAD.l + cW} y2={yp(e)}
            stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
          <text x={PAD.l - 5} y={yp(e) + 3.5} textAnchor="end"
            fill="rgba(255,255,255,0.32)" fontSize="8.5" fontFamily="monospace">
            {e}
          </text>
        </g>
      ))}
      <path d={fillD} fill="url(#eloHFill)" />
      <polyline points={linePoints} fill="none" stroke="#4da6ff"
        strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      {points.filter((p) => WC_YEARS.includes(p.year)).map((p) => (
        <circle key={p.year} cx={xp(p.year)} cy={yp(p.elo)} r="2.8"
          fill="#4da6ff" stroke="var(--bg, #0d0d0d)" strokeWidth="1.2" />
      ))}
      <text x={xp(lp.year) - 6} y={yp(lp.elo) - 5} textAnchor="end"
        fill="#4da6ff" fontSize="9" fontFamily="monospace" fontWeight="700">
        {lp.elo}
      </text>
      {WC_YEARS.map((yr) => (
        <text key={yr} x={xp(yr)} y={H - 5} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize="8.5" fontFamily="sans-serif">
          {yr}
        </text>
      ))}
    </svg>
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

          {/* ELO 走势图 */}
          {teamElo && (
            <section>
              <SectionTitle>近20年 ELO 走势</SectionTitle>
              <div style={{ margin: "0 16px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", padding: "10px 8px 4px" }}>
                <EloHistoryChart originalName={teamElo.originalName} code={teamElo.code} />
              </div>
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
