"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowLeftRight } from "lucide-react";
import { POSITION_LABEL } from "@/lib/canonical-names";
import { playerNameZh } from "@/lib/player-names-zh";
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

// ── History Timeline ──────────────────────────────────────────────────────────
function HistoryTimeline({ teamDetail }) {
  if (!teamDetail?.tournaments || teamDetail.tournaments.length < 3) return null;

  const tourneys = [...teamDetail.tournaments].reverse();
  const STAGE_SCORE = {
    "冠军": 7, "亚军": 6, "季军赛": 5, "第四名": 4,
    "四强": 5, "八强": 4, "十六强": 3, "第二轮小组赛": 2.5,
    "小组赛": 2, "第一轮": 1, "第二轮": 2,
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
    "冠军": "var(--amber)", "亚军": "var(--blue)", "季军赛": "#cd7f32",
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
        世界杯成绩走势
      </div>
      <div style={{ padding: "8px 8px 4px" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          {[2, 4, 6].map((s) => (
            <line key={s} x1={PAD.l} y1={yp(s)} x2={PAD.l + cW} y2={yp(s)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
          ))}
          <text x={PAD.l - 2} y={yp(7) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7">冠军</text>
          <text x={PAD.l - 2} y={yp(4) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7">八强</text>
          <text x={PAD.l - 2} y={yp(2) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7">小组</text>
          <polyline points={linePoints} fill="none" stroke="var(--blue)"
            strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
          {pts.map((p, i) => {
            const dotColor = STAGE_COLOR[p.stage] || "var(--blue)";
            const isSpecial = p.stage === "冠军" || p.stage === "亚军" || p.stage === "季军赛";
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
                    {p.stage === "冠军" ? "🏆" : p.stage === "亚军" ? "🥈" : "🥉"}
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
                        <div style={{ marginTop: 2, paddingLeft: 56, fontSize: 9, color: "var(--text3)", display: "flex", alignItems: "center", gap: 3 }}>
                          <MapPin size={9} strokeWidth={2} /> {m.venue.stadium}{m.venue.city ? `, ${m.venue.city}` : ""}
                        </div>
                      )}
                      {m.subs && m.subs.length > 0 && (
                        <div style={{ marginTop: 2, paddingLeft: 56, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {m.subs.map((s, si) => (
                            <span key={si} style={{ fontSize: 9, color: "var(--text3)" }}>
                              <ArrowLeftRight size={9} strokeWidth={2} style={{ display: "inline", verticalAlign: "-1px", marginRight: 2 }} /><span onClick={() => { const hid = lookup(s.playerOn); if (hid) openPlayer(hid, s.playerOn); }} style={{ cursor: "pointer" }}>{s.playerOn}</span> ← <span onClick={() => { const hid = lookup(s.playerOff); if (hid) openPlayer(hid, s.playerOff); }} style={{ cursor: "pointer" }}>{s.playerOff}</span> {s.minute}
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

export default function TabHistory({ historyData, teamDetail, squadData }) {
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();

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
              { value: bestResultLabel(bestResult), label: "最佳成绩", text: true },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRight: i < 2 ? "1px solid var(--border)" : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                <div style={{ fontSize: item.text ? 16 : 20, fontWeight: 900, color: "var(--blue)", lineHeight: 1, height: 24, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>{item.label}</div>
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

      {/* History timeline visualization */}
      <HistoryTimeline teamDetail={teamDetail} />

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



      {/* Top scorers */}
      {(() => {
        const topPlayers = teamDetail?.topPlayers || [];
        const topScorers = [...topPlayers].sort((a, b) => b.goals - a.goals).slice(0, 10);
        if (topScorers.length === 0) return null;
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
              队史世界杯射手榜
            </div>
            {topScorers.map((player, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", padding: "8px 12px", gap: 8,
                borderBottom: idx < topScorers.length - 1 ? "1px solid var(--border)" : "none",
                background: idx < 3 ? "rgba(92,158,255,0.04)" : "transparent",
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                  color: idx < 3 ? "var(--text2)" : "var(--text-dim)",
                  minWidth: 20, textAlign: "right",
                }}>
                  {idx + 1}.
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    onClick={() => {
                      const birthYear = player.birthDate?.substring(0, 4);
                      const hid = lookup(player.name, birthYear);
                      // Try to find SportMonks numeric ID from squad for photo support
                      const squadPlayer = squadData?.players?.find(p => p.name === player.name || p.nameZh === playerNameZh(player.name));
                      if (squadPlayer) {
                        openPlayer(String(squadPlayer.id), playerNameZh(player.name) || player.name, hid);
                      } else if (hid) {
                        openPlayer(hid, playerNameZh(player.name) || player.name);
                      }
                    }}
                    style={{ fontSize: 12, color: "var(--text)", fontWeight: idx < 3 ? 600 : 400, cursor: "pointer" }}
                  >
                    {playerNameZh(player.name)}
                  </div>
                  {playerNameZh(player.name) !== player.name && (
                    <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 1 }}>{player.name}</div>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "var(--blue)", fontVariantNumeric: "tabular-nums",
                }}>
                  {player.goals}球
                </span>
                <span style={{ fontSize: 10, color: "var(--text-dim)", fontVariantNumeric: "tabular-nums", minWidth: 30, textAlign: "right" }}>
                  {player.apps}场
                </span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
