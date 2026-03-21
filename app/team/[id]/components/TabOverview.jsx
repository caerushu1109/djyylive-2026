"use client";

import { useState, useEffect } from "react";
import GroupTable from "@/components/wc/GroupTable";
import { getTeamTrend } from "@/lib/hooks/useEloTrends";
import ProgressionFunnel from "./ProgressionFunnel";
import GroupComparisonCards from "./GroupOpponents";
import { H2HSection } from "./H2HCard";

const BEST_RESULT_ZH = {
  "winner":         "\ud83c\udfc6 \u51a0\u519b",
  "winners":        "\ud83c\udfc6 \u51a0\u519b",
  "runners-up":     "\ud83e\udd48 \u4e9a\u519b",
  "runner-up":      "\ud83e\udd48 \u4e9a\u519b",
  "third place":    "\ud83e\udd49 \u5b63\u519b",
  "fourth place":   "\u7b2c4\u540d",
  "semi-finals":    "\u56db\u5f3a",
  "quarter-finals": "\u516b\u5f3a",
  "round of 16":    "\u5341\u516d\u5f3a",
  "second round":   "\u7b2c\u4e8c\u8f6e",
  "first round":    "\u7b2c\u4e00\u8f6e",
  "group stage":    "\u5c0f\u7ec4\u8d5b\u51fa\u5c40",
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
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>ELO\u6a21\u578b</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "var(--blue)" }}>
          {modelPct != null ? `${modelPct.toFixed(1)}%` : "\u2014"}
        </div>
      </div>
      <div style={{ flex: 1, textAlign: "center", padding: "12px 8px", borderRight: "1px solid var(--border)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>POLYMARKET</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text2)" }}>
          {marketPct != null ? `${marketPct.toFixed(1)}%` : "\u2014"}
        </div>
      </div>
      <div style={{ flex: 1, textAlign: "center", padding: "12px 8px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>\u4ef7\u503c\u5dee</div>
        <div style={{
          fontSize: 18, fontWeight: 900, color: valColor,
          background: valBg, borderRadius: 6, padding: "2px 8px", display: "inline-block",
        }}>
          {value != null ? `${value > 0 ? "+" : ""}${value.toFixed(1)}%` : "\u2014"}
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
      \u52a0\u8f7d\u4e2d...
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

// ── Group ELO Trend Comparison Chart ──────────────────────────────────────────
function GroupEloChart({ teamCode, groupOpponentIsos, eloTrends, eloData }) {
  if (!eloTrends || !teamCode || !groupOpponentIsos || groupOpponentIsos.length === 0) return null;

  const allCodes = [teamCode, ...groupOpponentIsos];
  const teamTrends = allCodes.map((code) => getTeamTrend(eloTrends, code)).filter(Boolean);
  if (teamTrends.length < 2) return null;

  const COLORS = ["var(--blue)", "var(--green)", "var(--amber)", "var(--red)"];
  const W = 360, H = 140;
  const PAD = { t: 14, r: 16, b: 22, l: 40 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const allElos = teamTrends.flatMap((t) => t.points.map((p) => p.elo));
  const minE = Math.min(...allElos) - 50;
  const maxE = Math.max(...allElos) + 50;
  const allLabels = teamTrends[0].points.map((p) => p.label);
  const xp = (i) => PAD.l + (i / (allLabels.length - 1)) * cW;
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
        \u540c\u7ec4 ELO \u8d70\u52bf\u5bf9\u6bd4
      </div>
      <div style={{ padding: "8px 8px 4px" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          {yLines.map((e) => (
            <g key={e}>
              <line x1={PAD.l} y1={yp(e)} x2={PAD.l + cW} y2={yp(e)}
                stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
              <text x={PAD.l - 5} y={yp(e) + 3.5} textAnchor="end"
                fill="rgba(255,255,255,0.32)" fontSize="8.5" fontFamily="monospace">{e}</text>
            </g>
          ))}
          {allLabels.filter((_, i) => i % 2 === 0).map((label, idx) => {
            const i = allLabels.indexOf(label);
            return (
              <text key={label} x={xp(i)} y={H - 5} textAnchor="middle"
                fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="sans-serif">{label}</text>
            );
          })}
          {teamTrends.map((team, ti) => {
            const pts = team.points.map((p, i) => `${xp(i)},${yp(p.elo)}`).join(" ");
            return (
              <polyline key={team.code} points={pts} fill="none"
                stroke={COLORS[ti % COLORS.length]} strokeWidth={ti === 0 ? "2" : "1.4"}
                strokeLinejoin="round" strokeLinecap="round"
                opacity={ti === 0 ? 1 : 0.65} />
            );
          })}
          {teamTrends.map((team, ti) => {
            const lp = team.points[team.points.length - 1];
            const lastIdx = team.points.length - 1;
            return (
              <g key={`dot-${team.code}`}>
                <circle cx={xp(lastIdx)} cy={yp(lp.elo)} r="3"
                  fill={COLORS[ti % COLORS.length]} stroke="var(--bg)" strokeWidth="1" />
                <text x={xp(lastIdx) + 6} y={yp(lp.elo) + 3.5}
                  fill={COLORS[ti % COLORS.length]} fontSize="8" fontFamily="monospace" fontWeight="700">
                  {lp.elo}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{
        padding: "4px 12px 8px", display: "flex", flexWrap: "wrap", gap: 8,
      }}>
        {teamTrends.map((team, ti) => (
          <span key={team.code} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{
              display: "inline-block", width: 10, height: 3, borderRadius: 1,
              background: COLORS[ti % COLORS.length], opacity: ti === 0 ? 1 : 0.65,
            }} />
            <span style={{ color: COLORS[ti % COLORS.length], fontWeight: ti === 0 ? 700 : 500 }}>
              {team.name}
            </span>
          </span>
        ))}
      </div>
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
            \u4e3b\u6559\u7ec3 <span style={{ fontWeight: 700, color: "var(--text)" }}>{manager}</span>
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
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>\u573a</span>
            <span style={{ fontWeight: 700, color: "var(--green)" }}>{stats.w}</span>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>\u80dc</span>
            <span style={{ fontWeight: 700, color: "var(--text3)" }}>{stats.d}</span>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>\u5e73</span>
            <span style={{ fontWeight: 700, color: "var(--red)" }}>{stats.l}</span>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>\u8d1f</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-dim)" }}>
              \u80dc\u7387 <span style={{ fontWeight: 800, color: "var(--blue)", fontSize: 13 }}>{stats.winRate}%</span>
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <WDLBar w={stats.w} d={stats.d} l={stats.l} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: "var(--text-dim)" }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--green)", marginRight: 3, verticalAlign: "middle" }} />\u80dc</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--text3)", marginRight: 3, verticalAlign: "middle" }} />\u5e73</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--red)", marginRight: 3, verticalAlign: "middle" }} />\u8d1f</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TabOverview({ teamPred, marketPct, teamGroup, teamElo, historyData, teamDetail, groupOpponentIsos, eloData, predData, eloTrends, teamIso }) {
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

      {/* ELO chart */}
      {teamElo && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden", padding: "10px 8px 4px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", padding: "0 4px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            \u8fd120\u5e74 ELO \u8d70\u52bf
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
              { value: historyData.appearances ?? 0, label: "\u5c4a\u4e16\u754c\u676f" },
              { value: historyData.titles ?? 0,      label: "\u6b21\u51a0\u519b" },
              { value: bestResultLabel(historyData.bestResult), label: "\u6700\u4f73\u6210\u7ee9", small: true },
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
              \u593a\u51a0\u5e74\u4efd\uff1a<span style={{ color: "var(--blue)", fontWeight: 700 }}>{historyData.titleYears.join("\u3001")}</span>
            </div>
          )}
        </div>
      )}

      {/* Group opponents comparison */}
      <GroupComparisonCards
        teamElo={teamElo} teamPred={teamPred}
        groupOpponentIsos={groupOpponentIsos} eloData={eloData} predData={predData}
      />

      {/* Group ELO trend comparison */}
      <GroupEloChart
        teamCode={teamElo?.code} groupOpponentIsos={groupOpponentIsos}
        eloTrends={eloTrends} eloData={eloData}
      />

      {/* H2H vs group opponents */}
      <H2HSection teamIso={teamIso} groupOpponentIsos={groupOpponentIsos} />
    </div>
  );
}
