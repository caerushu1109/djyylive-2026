"use client";

import { useState, useEffect } from "react";
import GroupTable from "@/components/wc/GroupTable";

import ProgressionFunnel from "./ProgressionFunnel";
import GroupComparisonCards from "./GroupOpponents";
import { H2HSection } from "./H2HCard";

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

// ── Combined ELO Trend Chart (team + group opponents) ────────────────────────
function GroupEloChart({ teamElo, groupOpponentIsos, eloData }) {
  const [teamLines, setTeamLines] = useState([]);
  const [loadState, setLoadState] = useState("idle"); // idle | loading | done

  useEffect(() => {
    if (!teamElo?.originalName || !teamElo?.code) return;

    // Build list: current team first, then group opponents
    const teams = [{ name: teamElo.originalName, code: teamElo.code, zhName: teamElo.name }];
    if (groupOpponentIsos?.length > 0 && eloData?.rankings) {
      for (const iso of groupOpponentIsos) {
        const r = eloData.rankings.find((t) => t.code === iso);
        if (r) teams.push({ name: r.originalName, code: r.code, zhName: r.name });
      }
    }

    setLoadState("loading");
    Promise.all(
      teams.map((t) =>
        fetch(`/api/elo-history?name=${encodeURIComponent(t.name)}&code=${encodeURIComponent(t.code)}`)
          .then((r) => r.json())
          .then((d) => ({
            code: t.code,
            name: t.zhName || t.name,
            points: (d.points || []).filter((p) => p.year >= 2006),
          }))
          .catch(() => null)
      )
    ).then((results) => {
      setTeamLines(results.filter((r) => r && r.points.length >= 2));
      setLoadState("done");
    });
  }, [teamElo, groupOpponentIsos, eloData]);

  if (loadState === "idle") return null;
  if (loadState === "loading") return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden", padding: "10px 8px",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", padding: "0 4px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        同组 ELO 走势对比
      </div>
      <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 11 }}>
        加载中...
      </div>
    </div>
  );
  if (teamLines.length < 1) return null;

  const hasOpponents = teamLines.length > 1;
  const COLORS = ["#4da6ff", "#2ecc71", "#f5a623", "#e05252"];
  const W = 360, H = hasOpponents ? 150 : 110;
  const PAD = { t: 12, r: 50, b: 22, l: 38 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const WC_YEARS = [2006, 2010, 2014, 2018, 2022, 2026];

  const allElos = teamLines.flatMap((t) => t.points.map((p) => p.elo));
  const minE = Math.min(...allElos) - 40;
  const maxE = Math.max(...allElos) + 40;

  const xp = (yr) => PAD.l + ((yr - 2006) / 20) * cW;
  const yp = (e) => PAD.t + cH - ((e - minE) / (maxE - minE)) * cH;

  const yStep = Math.round((maxE - minE) / 3 / 50) * 50 || 50;
  const yStart = Math.ceil(minE / yStep) * yStep;
  const yLines = [];
  for (let e = yStart; e <= maxE; e += yStep) yLines.push(e);

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 12px", borderBottom: "1px solid var(--border)",
        fontSize: 10, fontWeight: 700, color: "var(--text3)",
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {hasOpponents ? "同组 ELO 走势对比" : "近20年 ELO 走势"}
      </div>
      <div style={{ padding: "8px 8px 4px" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          <defs>
            <linearGradient id="eloMainFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[0]} stopOpacity="0.15" />
              <stop offset="100%" stopColor={COLORS[0]} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Y grid */}
          {yLines.map((e) => (
            <g key={e}>
              <line x1={PAD.l} y1={yp(e)} x2={PAD.l + cW} y2={yp(e)}
                stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
              <text x={PAD.l - 5} y={yp(e) + 3.5} textAnchor="end"
                fill="rgba(255,255,255,0.32)" fontSize="8.5" fontFamily="monospace">{e}</text>
            </g>
          ))}
          {/* World Cup year markers */}
          {WC_YEARS.map((yr) => (
            <line key={yr} x1={xp(yr)} y1={PAD.t} x2={xp(yr)} y2={PAD.t + cH}
              stroke="rgba(255,193,7,0.15)" strokeWidth="1" strokeDasharray="2,3" />
          ))}
          {/* X labels */}
          {WC_YEARS.map((yr) => (
            <text key={yr} x={xp(yr)} y={H - 5} textAnchor="middle"
              fill="rgba(255,255,255,0.3)" fontSize="8.5" fontFamily="sans-serif">{yr}</text>
          ))}
          {/* Fill under main team line */}
          {teamLines[0]?.points.length > 1 && (() => {
            const pts = teamLines[0].points;
            const fp = pts[0], lp = pts[pts.length - 1];
            const fillD = `M${xp(fp.year)},${PAD.t + cH} L${xp(fp.year)},${yp(fp.elo)} ` +
              pts.slice(1).map((p) => `L${xp(p.year)},${yp(p.elo)}`).join(" ") +
              ` L${xp(lp.year)},${PAD.t + cH}Z`;
            return <path d={fillD} fill="url(#eloMainFill)" />;
          })()}
          {/* Draw opponent lines first (behind main line) */}
          {teamLines.slice(1).map((team, ti) => {
            const pts = team.points.map((p) => `${xp(p.year)},${yp(p.elo)}`).join(" ");
            return (
              <polyline key={team.code} points={pts} fill="none"
                stroke={COLORS[(ti + 1) % COLORS.length]} strokeWidth="1.3"
                strokeLinejoin="round" strokeLinecap="round" opacity="0.6" />
            );
          })}
          {/* Main team line (on top) */}
          {teamLines[0]?.points.length > 1 && (
            <polyline
              points={teamLines[0].points.map((p) => `${xp(p.year)},${yp(p.elo)}`).join(" ")}
              fill="none" stroke={COLORS[0]} strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" />
          )}
          {/* WC year dots for main team */}
          {teamLines[0]?.points.filter((p) => WC_YEARS.includes(p.year)).map((p) => (
            <circle key={p.year} cx={xp(p.year)} cy={yp(p.elo)} r="2.5"
              fill={COLORS[0]} stroke="var(--bg, #0d0d0d)" strokeWidth="1" />
          ))}
          {/* End labels for all teams */}
          {teamLines.map((team, ti) => {
            const lp = team.points[team.points.length - 1];
            if (!lp) return null;
            const color = COLORS[ti % COLORS.length];
            // Stagger labels to avoid overlap
            const yOffset = ti * 11;
            return (
              <g key={`label-${team.code}`}>
                <circle cx={xp(lp.year)} cy={yp(lp.elo)} r={ti === 0 ? "3" : "2.5"}
                  fill={color} stroke="var(--bg)" strokeWidth="1" />
                <text x={PAD.l + cW + 6} y={PAD.t + 8 + yOffset}
                  fill={color} fontSize="8" fontFamily="monospace" fontWeight={ti === 0 ? "700" : "500"}>
                  {team.name} {lp.elo}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      {hasOpponents && (
        <div style={{
          padding: "2px 12px 8px", display: "flex", flexWrap: "wrap", gap: 8,
        }}>
          {teamLines.map((team, ti) => (
            <span key={team.code} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{
                display: "inline-block", width: 10, height: ti === 0 ? 3 : 2, borderRadius: 1,
                background: COLORS[ti % COLORS.length], opacity: ti === 0 ? 1 : 0.6,
              }} />
              <span style={{ color: COLORS[ti % COLORS.length], fontWeight: ti === 0 ? 700 : 500 }}>
                {team.name}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Team Profile Card ──────────────────────────────────────────────────────────
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

export default function TabOverview({ teamPred, marketPct, teamGroup, teamElo, historyData, teamDetail, groupOpponentIsos, eloData, predData, teamIso }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px 20px" }}>
      {/* Team Profile Card */}
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

      {/* ELO trend chart (combined: team + group opponents) */}
      {teamElo && (
        <GroupEloChart teamElo={teamElo} groupOpponentIsos={groupOpponentIsos} eloData={eloData} />
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

      {/* Group opponents comparison */}
      <GroupComparisonCards
        teamElo={teamElo} teamPred={teamPred}
        groupOpponentIsos={groupOpponentIsos} eloData={eloData} predData={predData}
      />


      {/* H2H vs group opponents */}
      <H2HSection teamIso={teamIso} groupOpponentIsos={groupOpponentIsos} />
    </div>
  );
}
