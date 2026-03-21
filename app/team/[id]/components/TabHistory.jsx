"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { POSITION_LABEL } from "@/lib/utils/teamIso";
import { useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";

const POSITION_ORDER = ["GK", "DF", "MF", "FW"];

const POSITION_COLOR = {
  GK: "var(--amber, #f59e0b)",
  DF: "var(--blue, #5c9eff)",
  MF: "var(--green, #22c55e)",
  FW: "var(--red, #ef4444)",
};

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

// ── History Timeline ──────────────────────────────────────────────────────────
function HistoryTimeline({ teamDetail }) {
  if (!teamDetail?.tournaments || teamDetail.tournaments.length < 3) return null;

  const tourneys = [...teamDetail.tournaments].reverse();
  const STAGE_SCORE = {
    "\u51a0\u519b": 7, "\u4e9a\u519b": 6, "\u5b63\u519b\u8d5b": 5, "\u7b2c\u56db\u540d": 4,
    "\u56db\u5f3a": 5, "\u516b\u5f3a": 4, "\u5341\u516d\u5f3a": 3, "\u7b2c\u4e8c\u8f6e\u5c0f\u7ec4\u8d5b": 2.5,
    "\u5c0f\u7ec4\u8d5b": 2, "\u7b2c\u4e00\u8f6e": 1, "\u7b2c\u4e8c\u8f6e": 2,
  };

  const pts = tourneys.map((t) => ({
    year: t.year,
    stage: t.stage,
    score: STAGE_SCORE[t.stage] || 1,
  }));

  const W = 360, H = 90;
  const PAD = { t: 18, r: 16, b: 20, l: 16 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const maxScore = 7;

  const xp = (i) => PAD.l + (i / Math.max(pts.length - 1, 1)) * cW;
  const yp = (s) => PAD.t + cH - (s / maxScore) * cH;

  const linePoints = pts.map((p, i) => `${xp(i)},${yp(p.score)}`).join(" ");

  const STAGE_COLOR = {
    "\u51a0\u519b": "var(--amber)", "\u4e9a\u519b": "var(--blue)", "\u5b63\u519b\u8d5b": "#cd7f32",
  };

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
        \u4e16\u754c\u676f\u6210\u7ee9\u8d70\u52bf
      </div>
      <div style={{ padding: "8px 8px 4px" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          {[2, 4, 6].map((s) => (
            <line key={s} x1={PAD.l} y1={yp(s)} x2={PAD.l + cW} y2={yp(s)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
          ))}
          <text x={PAD.l - 2} y={yp(7) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7">\u51a0\u519b</text>
          <text x={PAD.l - 2} y={yp(4) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7">\u516b\u5f3a</text>
          <text x={PAD.l - 2} y={yp(2) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7">\u5c0f\u7ec4</text>
          <polyline points={linePoints} fill="none" stroke="var(--blue)"
            strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
          {pts.map((p, i) => {
            const dotColor = STAGE_COLOR[p.stage] || "var(--blue)";
            const isSpecial = p.stage === "\u51a0\u519b" || p.stage === "\u4e9a\u519b" || p.stage === "\u5b63\u519b\u8d5b";
            return (
              <g key={p.year}>
                <circle cx={xp(i)} cy={yp(p.score)} r={isSpecial ? 3.5 : 2.2}
                  fill={dotColor} stroke="var(--bg)" strokeWidth="1" />
                {(isSpecial || i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 6) === 0) && (
                  <text x={xp(i)} y={H - 4} textAnchor="middle"
                    fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="sans-serif">
                    {String(p.year).slice(2)}
                  </text>
                )}
                {isSpecial && (
                  <text x={xp(i)} y={yp(p.score) - 6} textAnchor="middle"
                    fill={dotColor} fontSize="7" fontWeight="700">
                    {p.stage === "\u51a0\u519b" ? "\ud83c\udfc6" : p.stage === "\u4e9a\u519b" ? "\ud83e\udd48" : "\ud83e\udd49"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── Tournament Accordion Item ─────────────────────────────────────────────────
export function TournamentAccordion({ tournament }) {
  const [expanded, setExpanded] = useState(false);
  const [showSquad, setShowSquad] = useState(false);
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();
  const router = useRouter();

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
                \u5c0f\u7ec4\u8d5b\u79ef\u5206 \u2014 {group.name}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr style={{ color: "var(--text-dim)", fontSize: 10 }}>
                      <th style={{ textAlign: "left", padding: "3px 4px", fontWeight: 600 }}>#</th>
                      <th style={{ textAlign: "left", padding: "3px 4px", fontWeight: 600 }}>\u7403\u961f</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>\u573a</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>\u80dc</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>\u5e73</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>\u8d1f</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>\u8fdb</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>\u5931</th>
                      <th style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600, color: "var(--blue)" }}>\u5206</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((row, idx) => (
                      <tr key={idx} style={{
                        borderTop: "1px solid var(--border)",
                        background: row.pos <= 2 ? "rgba(92,158,255,0.04)" : "transparent",
                      }}>
                        <td style={{ padding: "5px 4px", color: "var(--text-dim)", fontWeight: 700 }}>{row.pos}</td>
                        <td onClick={() => router.push(`/team/${encodeURIComponent(row.team)}`)} style={{ padding: "5px 4px", color: "var(--text)", fontWeight: 500, cursor: "pointer" }}>{row.team}</td>
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
                \u6bd4\u8d5b
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
                        <span onClick={() => router.push(`/team/${encodeURIComponent(m.home)}`)} style={{ fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>{m.home}</span>
                        <span style={{
                          fontWeight: 800, fontVariantNumeric: "tabular-nums", padding: "1px 6px",
                          borderRadius: 4, fontSize: 12,
                          background: isWin ? "var(--green-dim)" : isLoss ? "var(--red-dim)" : "var(--card2)",
                          color: isWin ? "var(--green)" : isLoss ? "var(--red)" : "var(--text2)",
                        }}>
                          {scoreStr}
                        </span>
                        <span onClick={() => router.push(`/team/${encodeURIComponent(m.away)}`)} style={{ fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>{m.away}</span>
                      </div>
                      {m.goals && m.goals.length > 0 && (
                        <div style={{ marginTop: 3, paddingLeft: 56, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {m.goals.map((g, gi) => (
                            <span key={gi} style={{ fontSize: 10, color: "var(--text-dim)" }}>
                              {g.ownGoal ? "(OG) " : ""}<span onClick={() => { const hid = lookup(g.player); if (hid) openPlayer(hid, g.player); }} style={{ cursor: "pointer" }}>{g.player}</span> {g.minute}{g.penalty ? " (P)" : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.venue && (
                        <div style={{ marginTop: 2, paddingLeft: 56, fontSize: 9, color: "var(--text3)" }}>
                          \ud83d\udccd {m.venue.stadium}{m.venue.city ? `, ${m.venue.city}` : ""}
                        </div>
                      )}
                      {m.subs && m.subs.length > 0 && (
                        <div style={{ marginTop: 2, paddingLeft: 56, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {m.subs.map((s, si) => (
                            <span key={si} style={{ fontSize: 9, color: "var(--text3)" }}>
                              \ud83d\udd04 <span onClick={() => { const hid = lookup(s.playerOn); if (hid) openPlayer(hid, s.playerOn); }} style={{ cursor: "pointer" }}>{s.playerOn}</span> \u2190 <span onClick={() => { const hid = lookup(s.playerOff); if (hid) openPlayer(hid, s.playerOff); }} style={{ cursor: "pointer" }}>{s.playerOff}</span> {s.minute}
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
                \u5927\u540d\u5355\uff08{squad.length}\u4eba\uff09
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

export default function TabHistory({ historyData, teamElo, teamDetail }) {
  if (!historyData && !teamDetail) return (
    <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>\u6682\u65e0\u5386\u53f2\u6570\u636e</p>
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
              { value: appearances ?? 0, label: "\u5c4a\u4e16\u754c\u676f" },
              { value: titles ?? 0,      label: "\u6b21\u51a0\u519b" },
              { value: bestResultLabel(bestResult), label: "\u6700\u4f73\u6210\u7ee9", small: true },
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
              \u593a\u51a0\u5e74\u4efd\uff1a<span style={{ color: "var(--blue)", fontWeight: 700 }}>{titleYears.join("\u3001")}</span>
            </div>
          )}
        </div>
      )}

      {/* History timeline visualization */}
      <HistoryTimeline teamDetail={teamDetail} />

      {/* Tournament accordions */}
      {tournaments.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            \u5386\u5c4a\u4e16\u754c\u676f\u8be6\u60c5
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
            \u5386\u5c4a\u4e16\u754c\u676f\u6210\u7ee9
          </div>
          {[...(historyData.history || [])].reverse().map((entry, i, arr) => {
            const stageLabel = bestResultLabel(entry.stage || entry.result);
            const isChampion = stageLabel.includes("\u51a0\u519b");
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
                    {entry.wins}\u80dc {entry.draws}\u5e73 {entry.losses}\u8d1f
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
            \u8fd120\u5e74 ELO \u8d70\u52bf
          </div>
          <EloHistoryChart originalName={teamElo.originalName} code={teamElo.code} />
        </div>
      )}
    </div>
  );
}
