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
import { EN_TO_ZH } from "@/lib/polymarket-names";
import MatchCard from "@/components/shared/MatchCard";
import GroupTable from "@/components/wc/GroupTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft } from "lucide-react";
import { POSITION_LABEL } from "@/lib/utils/teamIso";

const POSITION_ORDER = ["GK", "DF", "MF", "FW"];
const TABS = ["概览", "赛程", "历史", "阵容", "数据"];

const POSITION_COLOR = {
  GK: "var(--amber, #f59e0b)",
  DF: "var(--blue, #5c9eff)",
  MF: "var(--green, #22c55e)",
  FW: "var(--red, #ef4444)",
};

const BEST_RESULT_ZH = {
  "winner":         "🏆 冠军",
  "winners":        "🏆 冠军",
  "runners-up":     "🥈 亚军",
  "runner-up":      "🥈 亚军",
  "third place":    "🥉 季军",
  "fourth place":   "第4名",
  "semi-finals":    "四强",
  "quarter-finals": "八强",
  "round of 16":    "十六强",
  "second round":   "第二轮",
  "first round":    "第一轮",
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

// ── Tournament progression funnel ─────────────────────────────────────────────
const STAGES = [
  { key: "pQualify",  label: "出线" },
  { key: "pR16",      label: "16强" },
  { key: "pQF",       label: "8强" },
  { key: "pSF",       label: "4强" },
  { key: "pFinal",    label: "决赛" },
  { key: "pChampion", label: "夺冠" },
];

function ProgressionFunnel({ teamPred }) {
  if (!teamPred) return null;
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 12px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
          模型排名 <span style={{ fontWeight: 800, color: "var(--blue)", fontSize: 14 }}>#{teamPred.rank}</span>
        </span>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
          夺冠概率 <span style={{ fontWeight: 800, color: "var(--blue)", fontSize: 14 }}>{teamPred.probabilityValue?.toFixed(1)}%</span>
        </span>
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {STAGES.map(({ key, label }) => {
          const val = teamPred[key];
          if (val == null) return null;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", width: 28, textAlign: "right", flexShrink: 0 }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 16, background: "var(--card2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.max(val, 1)}%`, height: "100%",
                  background: key === "pChampion"
                    ? "linear-gradient(90deg, var(--blue), #4da6ff)"
                    : "var(--blue)",
                  borderRadius: 4,
                  opacity: key === "pChampion" ? 1 : 0.6 + (val / 100) * 0.4,
                }} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "var(--text)",
                width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0,
              }}>
                {val.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Model vs Market ──────────────────────────────────────────────────────────
function ModelMarketCard({ modelPct, marketPct }) {
  if (modelPct == null && marketPct == null) return null;
  const value = modelPct != null && marketPct != null ? modelPct - marketPct : null;
  const valColor = value == null ? "var(--text3)" : value > 0.5 ? "var(--green)" : value < -0.5 ? "var(--red)" : "var(--text3)";
  const valBg = value == null ? "var(--card2)" : value > 0.5 ? "var(--green-dim)" : value < -0.5 ? "var(--red-dim)" : "var(--card2)";
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden", display: "flex",
    }}>
      <div style={{ flex: 1, textAlign: "center", padding: "12px 8px", borderRight: "1px solid var(--border)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>ELO模型</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "var(--blue)" }}>
          {modelPct != null ? `${modelPct.toFixed(1)}%` : "—"}
        </div>
      </div>
      <div style={{ flex: 1, textAlign: "center", padding: "12px 8px", borderRight: "1px solid var(--border)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>POLYMARKET</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text2)" }}>
          {marketPct != null ? `${marketPct.toFixed(1)}%` : "—"}
        </div>
      </div>
      <div style={{ flex: 1, textAlign: "center", padding: "12px 8px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>价值差</div>
        <div style={{
          fontSize: 18, fontWeight: 900, color: valColor,
          background: valBg, borderRadius: 6, padding: "2px 8px", display: "inline-block",
        }}>
          {value != null ? `${value > 0 ? "+" : ""}${value.toFixed(1)}%` : "—"}
        </div>
      </div>
    </div>
  );
}

// ── ELO History Chart ─────────────────────────────────────────────────────────
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

// ── W/D/L Stacked Bar ─────────────────────────────────────────────────────────
function WDLBar({ w, d, l }) {
  const total = w + d + l;
  if (total === 0) return null;
  const wPct = (w / total) * 100;
  const dPct = (d / total) * 100;
  const lPct = (l / total) * 100;
  return (
    <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${wPct}%`, background: "var(--green)", transition: "width 0.3s" }} />
      <div style={{ width: `${dPct}%`, background: "var(--text3)", transition: "width 0.3s" }} />
      <div style={{ width: `${lPct}%`, background: "var(--red)", transition: "width 0.3s" }} />
    </div>
  );
}

// ── Team Profile Card (for Overview) ──────────────────────────────────────────
function TeamProfileCard({ teamDetail }) {
  if (!teamDetail) return null;
  const stats = teamDetail.totalStats;
  const manager = teamDetail.tournaments?.[0]?.manager;
  const confed = teamDetail.confederationZh || teamDetail.confederation;
  const confedEn = teamDetail.confederation;

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      {/* Confederation + Manager row */}
      <div style={{
        padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: "var(--blue)",
          background: "rgba(92,158,255,0.1)", borderRadius: 4, padding: "2px 8px",
        }}>
          {confed} {confedEn && confedEn !== confed ? confedEn : ""}
        </span>
        {manager && (
          <span style={{ fontSize: 11, color: "var(--text2)", marginLeft: "auto" }}>
            主教练 <span style={{ fontWeight: 700, color: "var(--text)" }}>{manager}</span>
          </span>
        )}
      </div>

      {/* Total WC stats summary */}
      {stats && (
        <div style={{ padding: "10px 12px" }}>
          <div style={{
            fontSize: 12, color: "var(--text)", fontVariantNumeric: "tabular-nums",
            display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap",
          }}>
            <span style={{ fontWeight: 700, color: "var(--blue)" }}>{stats.p}</span>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>场</span>
            <span style={{ fontWeight: 700, color: "var(--green)" }}>{stats.w}</span>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>胜</span>
            <span style={{ fontWeight: 700, color: "var(--text3)" }}>{stats.d}</span>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>平</span>
            <span style={{ fontWeight: 700, color: "var(--red)" }}>{stats.l}</span>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>负</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-dim)" }}>
              胜率 <span style={{ fontWeight: 800, color: "var(--blue)", fontSize: 13 }}>{stats.winRate}%</span>
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <WDLBar w={stats.w} d={stats.d} l={stats.l} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: "var(--text-dim)" }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--green)", marginRight: 3, verticalAlign: "middle" }} />胜</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--text3)", marginRight: 3, verticalAlign: "middle" }} />平</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--red)", marginRight: 3, verticalAlign: "middle" }} />负</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: 概览 ─────────────────────────────────────────────────────────────────
function TabOverview({ teamPred, marketPct, teamGroup, teamElo, historyData, teamDetail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px 20px" }}>
      {/* Team Profile Card (new) */}
      <TeamProfileCard teamDetail={teamDetail} />

      {/* Progression funnel */}
      {teamPred && <ProgressionFunnel teamPred={teamPred} />}

      {/* Model vs Market */}
      {(teamPred || marketPct != null) && (
        <ModelMarketCard
          modelPct={teamPred?.probabilityValue ?? null}
          marketPct={marketPct}
        />
      )}

      {/* Group standings */}
      {teamGroup && <GroupTable group={teamGroup} />}

      {/* ELO chart */}
      {teamElo && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden", padding: "10px 8px 4px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", padding: "0 4px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            近20年 ELO 走势
          </div>
          <EloHistoryChart originalName={teamElo.originalName} code={teamElo.code} />
        </div>
      )}

      {/* WC History summary (compact) */}
      {historyData && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{ display: "flex" }}>
            {[
              { value: historyData.appearances ?? 0, label: "届世界杯" },
              { value: historyData.titles ?? 0,      label: "次冠军" },
              { value: bestResultLabel(historyData.bestResult), label: "最佳成绩", small: true },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: item.small ? 11 : 20, fontWeight: 900, color: "var(--blue)", lineHeight: 1.2 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {historyData.titleYears?.length > 0 && (
            <div style={{ padding: "6px 12px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-dim)" }}>
              夺冠年份：<span style={{ color: "var(--blue)", fontWeight: 700 }}>{historyData.titleYears.join("、")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: 赛程 ─────────────────────────────────────────────────────────────────
function TabFixtures({ teamFixtures, fixturesLoading }) {
  return (
    <div style={{ padding: "12px 16px 20px" }}>
      {fixturesLoading ? <LoadingSpinner /> : teamFixtures.length === 0 ? (
        <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>暂无赛程数据</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teamFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)}
        </div>
      )}
    </div>
  );
}

// ── Tournament Accordion Item ─────────────────────────────────────────────────
function TournamentAccordion({ tournament }) {
  const [expanded, setExpanded] = useState(false);
  const [showSquad, setShowSquad] = useState(false);

  const { year, stage, manager, cards, group, matches, squad } = tournament;
  const yellowCards = cards?.yellow ?? 0;
  const redCards = cards?.red ?? 0;

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          width: "100%", display: "flex", alignItems: "center", padding: "10px 12px",
          gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text)",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--blue)", minWidth: 40, fontVariantNumeric: "tabular-nums" }}>
          {year}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, textAlign: "left" }}>
          {stage}
        </span>
        <span style={{ fontSize: 11, color: "var(--text2)", marginRight: 4 }}>
          {manager}
        </span>
        <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: "var(--amber)" }}>&#x1F7E1;{yellowCards}</span>
          {" "}
          <span style={{ color: "var(--red)" }}>&#x1F534;{redCards}</span>
        </span>
        <span style={{
          fontSize: 12, color: "var(--text-dim)",
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          marginLeft: 4,
        }}>
          &#x25B6;
        </span>
      </button>

      {/* Expanded content */}
      <div style={{
        maxHeight: expanded ? 2000 : 0,
        overflow: "hidden",
        transition: "max-height 0.35s ease",
      }}>
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Group standings */}
          {group && group.standings && (
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                小组赛积分 — {group.name}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr style={{ color: "var(--text-dim)", fontSize: 10 }}>
                      <th style={{ textAlign: "left", padding: "3px 4px", fontWeight: 600 }}>#</th>
                      <th style={{ textAlign: "left", padding: "3px 4px", fontWeight: 600 }}>球队</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>场</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>胜</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>平</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>负</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>进</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>失</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600, color: "var(--blue)" }}>分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((row, idx) => (
                      <tr key={idx} style={{
                        borderTop: "1px solid var(--border)",
                        background: row.pos <= 2 ? "rgba(92,158,255,0.04)" : "transparent",
                      }}>
                        <td style={{ padding: "5px 4px", color: "var(--text-dim)", fontWeight: 700 }}>{row.pos}</td>
                        <td style={{ padding: "5px 4px", color: "var(--text)", fontWeight: 500 }}>{row.team}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", color: "var(--text2)" }}>{row.p}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", color: "var(--green)" }}>{row.w}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", color: "var(--text3)" }}>{row.d}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", color: "var(--red)" }}>{row.l}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", color: "var(--text2)" }}>{row.gf}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", color: "var(--text2)" }}>{row.ga}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", fontWeight: 800, color: "var(--blue)" }}>{row.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Matches */}
          {matches && matches.length > 0 && (
            <div style={{ padding: "10px 12px", borderTop: group ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                比赛
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {matches.map((m, mi) => {
                  const isWin = m.homeScore > m.awayScore;
                  const isLoss = m.homeScore < m.awayScore;
                  const scoreStr = `${m.homeScore}-${m.awayScore}${m.pens ? ` (${m.penScore})` : ""}${m.extra ? " (aet)" : ""}`;
                  return (
                    <div key={mi} style={{ padding: "6px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <span style={{ color: "var(--text-dim)", fontSize: 10, minWidth: 50 }}>{m.stage}</span>
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>{m.home}</span>
                        <span style={{
                          fontWeight: 800, fontVariantNumeric: "tabular-nums", padding: "1px 6px",
                          borderRadius: 4, fontSize: 12,
                          background: isWin ? "var(--green-dim)" : isLoss ? "var(--red-dim)" : "var(--card2)",
                          color: isWin ? "var(--green)" : isLoss ? "var(--red)" : "var(--text2)",
                        }}>
                          {scoreStr}
                        </span>
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>{m.away}</span>
                      </div>
                      {m.goals && m.goals.length > 0 && (
                        <div style={{ marginTop: 3, paddingLeft: 56, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {m.goals.map((g, gi) => (
                            <span key={gi} style={{ fontSize: 10, color: "var(--text-dim)" }}>
                              {g.ownGoal ? "(OG) " : ""}{g.player} {g.minute}{g.penalty ? " (P)" : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Squad toggle */}
          {squad && squad.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSquad((p) => !p); }}
                style={{
                  width: "100%", padding: "8px 12px", background: "none", border: "none",
                  cursor: "pointer", color: "var(--blue)", fontSize: 11, fontWeight: 700,
                  textAlign: "left", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{
                  transform: showSquad ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease", fontSize: 10,
                }}>
                  &#x25B6;
                </span>
                大名单（{squad.length}人）
              </button>
              <div style={{
                maxHeight: showSquad ? 1200 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease",
              }}>
                <div style={{ padding: "0 12px 10px" }}>
                  {POSITION_ORDER.map((pos) => {
                    const posPlayers = squad.filter((p) => p.pos === pos);
                    if (posPlayers.length === 0) return null;
                    return (
                      <div key={pos} style={{ marginBottom: 6 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: POSITION_COLOR[pos],
                          marginBottom: 3, textTransform: "uppercase",
                        }}>
                          {POSITION_LABEL[pos]}
                        </div>
                        <div style={{
                          display: "grid", gridTemplateColumns: "1fr 1fr",
                          gap: "2px 8px", fontSize: 11, color: "var(--text2)",
                        }}>
                          {posPlayers.map((p, pi) => (
                            <span key={pi} style={{ fontVariantNumeric: "tabular-nums" }}>
                              <span style={{ color: "var(--text-dim)", fontSize: 10, marginRight: 3 }}>#{p.num}</span>
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: 历史 (Rewritten with accordion) ──────────────────────────────────────
function TabHistory({ historyData, teamElo, teamDetail }) {
  if (!historyData && !teamDetail) return (
    <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>暂无历史数据</p>
  );

  const { appearances, titles, titleYears, bestResult } = historyData || {};
  const tournaments = teamDetail?.tournaments || [];

  return (
    <div style={{ padding: "12px 16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Summary stats */}
      {historyData && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{ display: "flex" }}>
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
          {titleYears?.length > 0 && (
            <div style={{ padding: "6px 12px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-dim)" }}>
              夺冠年份：<span style={{ color: "var(--blue)", fontWeight: 700 }}>{titleYears.join("、")}</span>
            </div>
          )}
        </div>
      )}

      {/* Tournament accordions */}
      {tournaments.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            历届世界杯详情
          </div>
          {tournaments.map((t, i) => (
            <TournamentAccordion key={t.year || i} tournament={t} />
          ))}
        </>
      )}

      {/* Fallback: if no teamDetail tournaments but historyData exists, show old-style list */}
      {tournaments.length === 0 && historyData?.history && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px", background: "var(--card2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            历届世界杯成绩
          </div>
          {[...(historyData.history || [])].reverse().map((entry, i, arr) => {
            const stageLabel = bestResultLabel(entry.stage || entry.result);
            const isChampion = stageLabel.includes("冠军");
            return (
              <div key={entry.year} style={{
                display: "flex", alignItems: "center", padding: "8px 12px", gap: 10,
                borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                background: isChampion ? "rgba(92,158,255,0.06)" : "transparent",
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: isChampion ? "var(--blue)" : "var(--text-dim)",
                  minWidth: 36,
                }}>{entry.year}</span>
                <span style={{
                  fontSize: 12, flex: 1,
                  color: isChampion ? "var(--blue)" : "var(--text)",
                  fontWeight: isChampion ? 700 : 400,
                }}>{stageLabel}</span>
                {entry.wins != null && (
                  <span style={{ fontSize: 10, color: "var(--text-dim)", fontVariantNumeric: "tabular-nums" }}>
                    {entry.wins}胜 {entry.draws}平 {entry.losses}负
                  </span>
                )}
                {entry.gf != null && (
                  <span style={{ fontSize: 10, color: "var(--text-dim)", minWidth: 32, textAlign: "right" }}>
                    {entry.gf}-{entry.ga}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ELO chart */}
      {teamElo && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden", padding: "10px 8px 4px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", padding: "0 4px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            近20年 ELO 走势
          </div>
          <EloHistoryChart originalName={teamElo.originalName} code={teamElo.code} />
        </div>
      )}
    </div>
  );
}

// ── Tab: 阵容 (Enhanced with position colors + WC stats) ──────────────────────
function TabSquad({ squadData, teamDetail }) {
  if (!squadData?.players?.length) return (
    <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>暂无阵容数据</p>
  );

  const { players } = squadData;
  const byPosition = {};
  for (const pos of POSITION_ORDER) byPosition[pos] = [];
  for (const p of players) {
    if (byPosition[p.position]) byPosition[p.position].push(p);
    else byPosition["FW"] = [...(byPosition["FW"] || []), p];
  }

  // Build top players lookup from teamDetail
  const topPlayersMap = useMemo(() => {
    const map = {};
    if (teamDetail?.topPlayers) {
      for (const tp of teamDetail.topPlayers) {
        map[tp.name.toLowerCase()] = tp;
      }
    }
    return map;
  }, [teamDetail]);

  return (
    <div style={{ padding: "12px 16px 20px" }}>
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", overflow: "hidden",
      }}>
        {POSITION_ORDER.filter(pos => byPosition[pos]?.length > 0).map((pos, pi) => (
          <div key={pos}>
            <div style={{
              padding: "6px 12px",
              fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
              color: "var(--text-dim)", background: "var(--card2)",
              borderTop: pi > 0 ? "1px solid var(--border)" : "none",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: POSITION_COLOR[pos],
              }} />
              {POSITION_LABEL[pos]}（{byPosition[pos].length}人）
            </div>
            {byPosition[pos].map((p, i) => {
              const playerKey = p.name?.toLowerCase();
              const wcStats = topPlayersMap[playerKey];
              return (
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
                  {wcStats && (
                    <span style={{
                      fontSize: 10, color: "var(--text-dim)",
                      background: "var(--card2)", borderRadius: 4, padding: "2px 6px",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      WC: {wcStats.apps}场 {wcStats.goals}球
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", marginTop: 8 }}>
        共 {players.length} 人
      </div>
    </div>
  );
}

// ── Tab: 数据 (New Stats tab) ─────────────────────────────────────────────────
function TabStats({ teamDetail }) {
  if (!teamDetail) return (
    <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>暂无数据</p>
  );

  const stats = teamDetail.totalStats;
  const topPlayers = teamDetail.topPlayers || [];
  const topScorers = [...topPlayers].sort((a, b) => b.goals - a.goals).slice(0, 10);

  const total = (stats?.w || 0) + (stats?.d || 0) + (stats?.l || 0);
  const wPct = total > 0 ? ((stats.w / total) * 100).toFixed(1) : 0;
  const dPct = total > 0 ? ((stats.d / total) * 100).toFixed(1) : 0;
  const lPct = total > 0 ? ((stats.l / total) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "12px 16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Total record card */}
      {stats && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px", background: "var(--card2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            总战绩
          </div>
          <div style={{ padding: "12px" }}>
            {/* Large stat numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, textAlign: "center", marginBottom: 12 }}>
              {[
                { value: stats.p, label: "场次", color: "var(--text)" },
                { value: stats.gf, label: "进球", color: "var(--green)" },
                { value: stats.ga, label: "失球", color: "var(--red)" },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: item.color, fontVariantNumeric: "tabular-nums" }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* W/D/L horizontal bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <WDLBar w={stats.w} d={stats.d} l={stats.l} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              <span>
                <span style={{ color: "var(--green)", fontWeight: 700 }}>{stats.w}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 10 }}> 胜 ({wPct}%)</span>
              </span>
              <span>
                <span style={{ color: "var(--text3)", fontWeight: 700 }}>{stats.d}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 10 }}> 平 ({dPct}%)</span>
              </span>
              <span>
                <span style={{ color: "var(--red)", fontWeight: 700 }}>{stats.l}</span>
                <span style={{ color: "var(--text-dim)", fontSize: 10 }}> 负 ({lPct}%)</span>
              </span>
            </div>

            {/* Goal difference */}
            {stats.gd != null && (
              <div style={{
                marginTop: 10, textAlign: "center", fontSize: 12, color: "var(--text-dim)",
                padding: "6px 0", borderTop: "1px solid var(--border)",
              }}>
                净胜球 <span style={{ fontWeight: 800, color: stats.gd >= 0 ? "var(--green)" : "var(--red)", fontSize: 16 }}>
                  {stats.gd > 0 ? "+" : ""}{stats.gd}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discipline card */}
      {stats && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px", background: "var(--card2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            纪律记录
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--amber)", fontVariantNumeric: "tabular-nums" }}>
                {stats.yellow ?? 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                &#x1F7E1; 黄牌
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: "14px 8px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--red)", fontVariantNumeric: "tabular-nums" }}>
                {stats.red ?? 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                &#x1F534; 红牌
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top scorers card */}
      {topScorers.length > 0 && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px", background: "var(--card2)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            队史射手榜
          </div>
          {topScorers.map((player, idx) => (
            <div key={idx} style={{
              display: "flex", alignItems: "center", padding: "8px 12px", gap: 8,
              borderBottom: idx < topScorers.length - 1 ? "1px solid var(--border)" : "none",
              background: idx < 3 ? "rgba(92,158,255,0.04)" : "transparent",
            }}>
              <span style={{
                fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                color: idx === 0 ? "var(--amber)" : idx === 1 ? "var(--text2)" : idx === 2 ? "#cd7f32" : "var(--text-dim)",
                minWidth: 20, textAlign: "right",
              }}>
                {idx + 1}.
              </span>
              <span style={{ fontSize: 12, flex: 1, color: "var(--text)", fontWeight: idx < 3 ? 600 : 400 }}>
                {player.name}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "var(--blue)", fontVariantNumeric: "tabular-nums",
              }}>
                {player.goals}&#x26BD;
              </span>
              <span style={{ fontSize: 10, color: "var(--text-dim)", fontVariantNumeric: "tabular-nums", minWidth: 30, textAlign: "right" }}>
                {player.apps}场
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TeamPage() {
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

  const teamElo = useMemo(() =>
    (eloData?.rankings || []).find(
      (r) => r.originalName === teamName || r.name === teamName || r.code === teamName
    ),
    [eloData, teamName]
  );

  const lookupName = teamElo?.originalName || teamName;
  const group = useTeamGroup(lookupName);

  const teamFixtures = useMemo(() => {
    const zhName = teamElo?.name;
    return (fixturesData?.fixtures || []).filter(
      (f) =>
        f.home.originalName === teamName || f.away.originalName === teamName ||
        f.home.name === teamName         || f.away.name === teamName ||
        (zhName && (f.home.name === zhName || f.away.name === zhName))
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

  const flag        = teamElo?.flag || "\uD83C\uDFF4";
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

      {eloLoading ? <LoadingSpinner /> : (
        <>
          {/* Hero -- always visible */}
          <div style={{
            padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 14,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 44, lineHeight: 1 }}>{flag}</span>
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
              />
            )}
            {activeTab === "赛程" && (
              <TabFixtures teamFixtures={teamFixtures} fixturesLoading={fixturesLoading} />
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
