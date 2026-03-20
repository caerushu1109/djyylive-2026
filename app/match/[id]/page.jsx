"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMatchDetail } from "@/lib/hooks/useMatchDetail";
import { useH2H } from "@/lib/hooks/useH2H";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { nameToIso } from "@/lib/utils/teamIso";
import { getTeamMeta } from "@/src/lib/team-meta";

/* ── Tabs ───────────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "概况" },
  { id: "stats",    label: "统计" },
  { id: "odds",     label: "赔率" },
  { id: "lineups",  label: "阵容" },
  { id: "events",   label: "事件" },
  { id: "h2h",      label: "H2H" },
];

/* ── Helpers ─────────────────────────────────────────── */
const POS_ZH = { GK: "门将", DF: "后卫", MF: "中场", FW: "前锋" };

function eventIcon(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("goal")) return "⚽";
  if (t.includes("yellow")) return "🟨";
  if (t.includes("red")) return "🟥";
  if (t.includes("sub")) return "🔄";
  if (t.includes("var")) return "📺";
  if (t.includes("pen") && t.includes("miss")) return "❌";
  return "•";
}

/* ── Score Header ───────────────────────────────────── */
function ScoreHeader({ fixture, onBack }) {
  return (
    <div style={{ background: "linear-gradient(180deg, #151825 0%, #0e1018 100%)" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", padding: "10px 12px 0", gap: 10,
      }}>
        <button onClick={onBack} style={{
          fontSize: 20, color: "var(--text2)", padding: "2px 6px",
          background: "none", border: "none", cursor: "pointer", lineHeight: 1,
        }}>‹</button>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>
          {fixture.stage || "2026 世界杯"}
        </span>
        {fixture.status === "LIVE" && (
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,61,61,0.12)", border: "1px solid rgba(255,61,61,0.3)",
            borderRadius: 6, padding: "3px 8px",
          }}>
            <span style={{
              width: 6, height: 6, background: "var(--live)", borderRadius: "50%",
              animation: "pulse 1.5s infinite", display: "inline-block",
            }} />
            <span style={{ fontSize: 10, color: "var(--live)", fontWeight: 800 }}>
              LIVE {fixture.minute}
            </span>
          </div>
        )}
      </div>

      {/* Score area */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 14px", gap: 6 }}>
        {/* Home */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>{fixture.home.flag}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", textAlign: "center", lineHeight: 1.3 }}>
            {fixture.home.name}
          </span>
        </div>

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, minWidth: 90 }}>
          {fixture.status !== "NS" ? (
            <div style={{
              fontSize: 42, fontWeight: 900, color: "var(--text)",
              letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
            }}>
              {fixture.homeScore ?? 0}<span style={{ color: "var(--text3)", margin: "0 2px" }}>-</span>{fixture.awayScore ?? 0}
            </div>
          ) : (
            <div style={{ fontSize: 24, fontWeight: 300, color: "var(--text2)" }}>VS</div>
          )}
          {fixture.status === "LIVE" && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: "var(--live)",
              background: "rgba(255,61,61,0.12)", padding: "2px 10px",
              borderRadius: 4, marginTop: 4,
            }}>
              {fixture.minute}
            </div>
          )}
          {fixture.status === "FT" && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: "var(--text3)",
              background: "var(--card2)", padding: "2px 10px",
              borderRadius: 4, marginTop: 4,
            }}>
              全场结束
            </div>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>{fixture.away.flag}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", textAlign: "center", lineHeight: 1.3 }}>
            {fixture.away.name}
          </span>
        </div>
      </div>

      {/* Venue */}
      {fixture.venue && (
        <div style={{ textAlign: "center", fontSize: 10, color: "var(--text3)", paddingBottom: 10 }}>
          📍 {fixture.venue}
        </div>
      )}
    </div>
  );
}

/* ── Stat Bar (bilateral) ────────────────────────────── */
function StatBar({ label, left, right, leftWidth, highlight }) {
  const isHighlightLeft = highlight && parseFloat(left) > parseFloat(right);
  const isHighlightRight = highlight && parseFloat(right) > parseFloat(left);
  return (
    <div style={{ padding: "8px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{
          fontSize: 12, fontWeight: isHighlightLeft ? 800 : 600,
          color: isHighlightLeft ? "var(--blue)" : "var(--text2)",
          fontVariantNumeric: "tabular-nums",
        }}>{left}</span>
        <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>{label}</span>
        <span style={{
          fontSize: 12, fontWeight: isHighlightRight ? 800 : 600,
          color: isHighlightRight ? "var(--red)" : "var(--text2)",
          fontVariantNumeric: "tabular-nums",
        }}>{right}</span>
      </div>
      <div style={{
        display: "flex", gap: 3, height: 4, borderRadius: 2,
      }}>
        <div style={{
          flex: leftWidth, height: "100%", borderRadius: "2px 0 0 2px",
          background: isHighlightLeft ? "var(--blue)" : "rgba(100,130,180,0.25)",
          transition: "flex 0.3s",
        }} />
        <div style={{
          flex: 100 - leftWidth, height: "100%", borderRadius: "0 2px 2px 0",
          background: isHighlightRight ? "var(--red)" : "rgba(180,100,100,0.25)",
          transition: "flex 0.3s",
        }} />
      </div>
    </div>
  );
}

/* ── Key Stat Pill (for overview) ─────────────────────── */
function KeyStatPill({ label, homeVal, awayVal }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, textAlign: "center",
      background: "var(--card)", borderRadius: 8, padding: "10px 4px",
    }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 15, fontWeight: 800, color: "var(--blue)",
          fontVariantNumeric: "tabular-nums",
        }}>{homeVal}</span>
        <span style={{ fontSize: 10, color: "var(--text3)", alignSelf: "center" }}>vs</span>
        <span style={{
          fontSize: 15, fontWeight: 800, color: "var(--red)",
          fontVariantNumeric: "tabular-nums",
        }}>{awayVal}</span>
      </div>
      <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
    </div>
  );
}

/* ── Goal Scorers Strip ──────────────────────────────── */
function GoalScorers({ events, fixture }) {
  const goals = (events || []).filter((e) => e.type?.includes("goal"));
  if (!goals.length) return null;
  const homeGoals = goals.filter((e) => e.team === fixture.home.originalName);
  const awayGoals = goals.filter((e) => e.team === fixture.away.originalName);
  return (
    <div style={{
      display: "flex", padding: "6px 16px 2px", gap: 16, justifyContent: "space-between",
    }}>
      <div style={{ flex: 1, textAlign: "left" }}>
        {homeGoals.map((g, i) => (
          <div key={i} style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.6 }}>
            ⚽ {g.title} {g.minute}&apos;
          </div>
        ))}
      </div>
      <div style={{ flex: 1, textAlign: "right" }}>
        {awayGoals.map((g, i) => (
          <div key={i} style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.6 }}>
            {g.title} {g.minute}&apos; ⚽
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Win Probability Bar ──────────────────────────────── */
function WinProbBar({ predictions, fixture }) {
  if (!predictions || predictions.home_win == null) return null;
  const h = predictions.home_win;
  const d = predictions.draw;
  const a = predictions.away_win;
  return (
    <div style={{
      background: "var(--card)", borderRadius: 10, padding: "10px 14px",
      border: "1px solid var(--border)",
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: "var(--text3)",
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
      }}>
        AI 胜率预测
      </div>
      <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ flex: h, background: "var(--blue)", borderRadius: "6px 0 0 6px" }} />
        <div style={{ flex: d, background: "var(--text3)" }} />
        <div style={{ flex: a, background: "var(--red)", borderRadius: "0 6px 6px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--blue)" }}>{h}%</div>
          <div style={{ fontSize: 9, color: "var(--text3)" }}>{fixture.home.name}胜</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text3)" }}>{d}%</div>
          <div style={{ fontSize: 9, color: "var(--text3)" }}>平局</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--red)" }}>{a}%</div>
          <div style={{ fontSize: 9, color: "var(--text3)" }}>{fixture.away.name}胜</div>
        </div>
      </div>
      {(predictions.btts_yes || predictions.over_2_5 || predictions.correct_score) && (
        <div style={{
          display: "flex", gap: 8, marginTop: 10, paddingTop: 8,
          borderTop: "1px solid var(--border)",
        }}>
          {predictions.correct_score && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{predictions.correct_score}</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>预测比分</div>
            </div>
          )}
          {predictions.over_2_5 != null && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{predictions.over_2_5}%</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>大2.5球</div>
            </div>
          )}
          {predictions.btts_yes != null && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{predictions.btts_yes}%</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>双方进球</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Tab: Overview ───────────────────────────────────── */
function TabOverview({ data }) {
  const { stats, events, fixture, predictions } = data;

  if (fixture.status === "NS") {
    return (
      <div style={{ padding: "12px 12px 0" }}>
        {predictions && <WinProbBar predictions={predictions} fixture={fixture} />}
        {!predictions && (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
            比赛尚未开始，开赛后将实时更新数据
          </div>
        )}
        <div style={{ height: 12 }} />
      </div>
    );
  }

  // Pick key stats for overview: possession, shots, shots_on_target, xG, corners, fouls
  const keyLabels = ["控球率", "射门", "射正", "xG", "角球", "犯规"];
  const keyStats = keyLabels.map((l) => stats.find((s) => s.label === l)).filter(Boolean);

  // Recent events (last 5)
  const recentEvents = [...(events || [])].reverse().slice(0, 5);

  return (
    <div style={{ padding: "12px 12px 0" }}>
      {/* Predictions */}
      {predictions && (
        <div style={{ marginBottom: 12 }}>
          <WinProbBar predictions={predictions} fixture={fixture} />
        </div>
      )}

      {/* Key stats grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 6, marginBottom: 14,
      }}>
        {keyStats.map((s) => (
          <KeyStatPill key={s.label} label={s.label} homeVal={s.left} awayVal={s.right} />
        ))}
      </div>

      {/* Recent events */}
      {recentEvents.length > 0 && (
        <div style={{
          background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border)", overflow: "hidden",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            padding: "8px 12px 6px", textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            最近事件
          </div>
          {recentEvents.map((ev, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
              borderTop: "1px solid var(--border)",
            }}>
              <span style={{
                fontSize: 10, color: "var(--text3)", fontVariantNumeric: "tabular-nums",
                width: 24, textAlign: "right", flexShrink: 0,
              }}>{ev.minuteLabel}</span>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{ev.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", flex: 1 }}>
                {ev.teamMeta?.flag} {ev.title}
              </span>
              {ev.subtitle && (
                <span style={{ fontSize: 10, color: "var(--text3)", flexShrink: 0 }}>{ev.subtitle}</span>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 12 }} />
    </div>
  );
}

/* ── Tab: Stats ──────────────────────────────────────── */
function TabStats({ data }) {
  const { stats, fixture } = data;
  if (fixture.status === "NS") {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        比赛尚未开始
      </div>
    );
  }

  // Group stats into categories
  const shooting = ["射门", "射正", "射偏", "被封堵", "xG"];
  const passing = ["传球", "传球准确率", "角球"];
  const defending = ["铲球", "拦截", "扑救"];
  const discipline = ["犯规", "越位", "黄牌", "红牌"];

  const groups = [
    { title: "控球", stats: stats.filter((s) => s.label === "控球率") },
    { title: "射门", stats: stats.filter((s) => shooting.includes(s.label)) },
    { title: "传控", stats: stats.filter((s) => passing.includes(s.label)) },
    { title: "防守", stats: stats.filter((s) => defending.includes(s.label)) },
    { title: "纪律", stats: stats.filter((s) => discipline.includes(s.label)) },
  ].filter((g) => g.stats.length > 0);

  return (
    <div style={{ padding: "6px 0" }}>
      {/* Team labels */}
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "8px 16px 4px",
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>
          {fixture.home.flag} {fixture.home.name}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--red)" }}>
          {fixture.away.name} {fixture.away.flag}
        </span>
      </div>
      {groups.map((g) => (
        <div key={g.title}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "10px 16px 2px",
          }}>
            {g.title}
          </div>
          {g.stats.map((s) => (
            <StatBar key={s.label} {...s} highlight />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Tab: Odds ───────────────────────────────────────── */
function TabOdds({ data }) {
  const { odds, fixture } = data;
  if (!odds) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        暂无赔率数据（通常赛前1-2周开放）
      </div>
    );
  }

  const ftOdds = odds["1X2"] || [];
  const ah = odds.asian_handicap;
  const ou = odds.over_under;

  return (
    <div style={{ padding: "12px" }}>
      {/* 1X2 */}
      {ftOdds.length > 0 && (
        <div style={{
          background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 12px 8px",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: "var(--text3)",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>胜平负 (1X2)</span>
          </div>
          {/* Header */}
          <div style={{
            display: "flex", padding: "6px 12px",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ flex: 1, fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>博彩公司</span>
            <span style={{ width: 56, fontSize: 9, color: "var(--blue)", fontWeight: 700, textAlign: "center" }}>
              {fixture.home.name}
            </span>
            <span style={{ width: 56, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>
              平局
            </span>
            <span style={{ width: 56, fontSize: 9, color: "var(--red)", fontWeight: 700, textAlign: "center" }}>
              {fixture.away.name}
            </span>
          </div>
          {/* Rows */}
          {ftOdds.map((o, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", padding: "8px 12px",
              borderBottom: i < ftOdds.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ flex: 1, fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
                {o.bookmaker}
              </span>
              <OddCell value={o.home} highlight={o.home <= o.draw && o.home <= o.away} color="blue" />
              <OddCell value={o.draw} highlight={false} color="dim" />
              <OddCell value={o.away} highlight={o.away <= o.draw && o.away <= o.home} color="red" />
            </div>
          ))}
        </div>
      )}

      {/* Asian Handicap & Over/Under side by side */}
      <div style={{ display: "flex", gap: 8 }}>
        {ah && (
          <div style={{
            flex: 1, background: "var(--card)", borderRadius: 10,
            border: "1px solid var(--border)", padding: "12px",
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: "var(--text3)",
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
            }}>亚洲盘口</div>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <span style={{
                fontSize: 12, fontWeight: 800, color: "var(--text)",
                background: "var(--card2)", padding: "2px 8px", borderRadius: 4,
              }}>{ah.line > 0 ? `+${ah.line}` : ah.line}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--blue)" }}>{ah.home}</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>主队</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--red)" }}>{ah.away}</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>客队</div>
              </div>
            </div>
            <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "center", marginTop: 6 }}>
              {ah.bookmaker}
            </div>
          </div>
        )}
        {ou && (
          <div style={{
            flex: 1, background: "var(--card)", borderRadius: 10,
            border: "1px solid var(--border)", padding: "12px",
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: "var(--text3)",
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
            }}>大小球</div>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <span style={{
                fontSize: 12, fontWeight: 800, color: "var(--text)",
                background: "var(--card2)", padding: "2px 8px", borderRadius: 4,
              }}>{ou.line}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--green, #4caf50)" }}>{ou.over}</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>大球</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--orange, #ff9800)" }}>{ou.under}</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>小球</div>
              </div>
            </div>
            <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "center", marginTop: 6 }}>
              {ou.bookmaker}
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 12 }} />
    </div>
  );
}

function OddCell({ value, highlight, color }) {
  const colorMap = { blue: "var(--blue)", red: "var(--red)", dim: "var(--text2)" };
  return (
    <span style={{
      width: 56, textAlign: "center", fontSize: 13,
      fontWeight: highlight ? 800 : 600,
      fontVariantNumeric: "tabular-nums",
      color: highlight ? colorMap[color] : "var(--text2)",
    }}>
      {typeof value === "number" ? value.toFixed(2) : value}
    </span>
  );
}

/* ── Tab: Lineups ────────────────────────────────────── */
function PlayerRow({ player, isHome }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
      flexDirection: isHome ? "row" : "row-reverse",
    }}>
      <span style={{
        fontSize: 11, fontWeight: 800, color: "var(--text3)",
        width: 22, textAlign: "center", fontVariantNumeric: "tabular-nums",
      }}>{player.number}</span>
      <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 600 }}>
        {player.name}
      </span>
      <span style={{
        fontSize: 9, color: "var(--text3)", fontWeight: 600,
        background: "var(--card2)", padding: "1px 5px", borderRadius: 3,
      }}>
        {POS_ZH[player.position] || player.position}
      </span>
    </div>
  );
}

function TabLineups({ data }) {
  const { lineups, fixture } = data;
  if (!lineups) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        {fixture.status === "NS" ? "比赛尚未开始，预计赛前1小时公布首发" : "暂无阵容数据"}
      </div>
    );
  }

  const { home, away } = lineups;

  return (
    <div style={{ padding: "12px" }}>
      {/* Formations */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--card)", borderRadius: 10, padding: "12px 16px",
        border: "1px solid var(--border)", marginBottom: 12,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 2 }}>
            {fixture.home.flag} {fixture.home.name}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--blue)" }}>
            {home?.formation || "—"}
          </div>
          {home?.coach && (
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
              🧑‍💼 {home.coach}
            </div>
          )}
        </div>
        <div style={{
          fontSize: 9, color: "var(--text3)", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          阵型
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 2 }}>
            {fixture.away.name} {fixture.away.flag}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--red)" }}>
            {away?.formation || "—"}
          </div>
          {away?.coach && (
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
              🧑‍💼 {away.coach}
            </div>
          )}
        </div>
      </div>

      {/* Starting XI side-by-side */}
      <div style={{
        background: "var(--card)", borderRadius: 10,
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "var(--text3)",
          padding: "8px 12px 6px", textTransform: "uppercase", letterSpacing: "0.06em",
          borderBottom: "1px solid var(--border)",
        }}>
          首发阵容
        </div>
        <div style={{ display: "flex" }}>
          {/* Home XI */}
          <div style={{ flex: 1, padding: "6px 12px", borderRight: "1px solid var(--border)" }}>
            {(home?.starting || []).map((p, i) => (
              <PlayerRow key={i} player={p} isHome={true} />
            ))}
          </div>
          {/* Away XI */}
          <div style={{ flex: 1, padding: "6px 12px" }}>
            {(away?.starting || []).map((p, i) => (
              <PlayerRow key={i} player={p} isHome={false} />
            ))}
          </div>
        </div>
      </div>

      {/* Bench */}
      {((home?.bench?.length > 0) || (away?.bench?.length > 0)) && (
        <div style={{
          background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border)", overflow: "hidden", marginTop: 10,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            padding: "8px 12px 6px", textTransform: "uppercase", letterSpacing: "0.06em",
            borderBottom: "1px solid var(--border)",
          }}>
            替补席
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, padding: "6px 12px", borderRight: "1px solid var(--border)" }}>
              {(home?.bench || []).map((p, i) => (
                <PlayerRow key={i} player={p} isHome={true} />
              ))}
            </div>
            <div style={{ flex: 1, padding: "6px 12px" }}>
              {(away?.bench || []).map((p, i) => (
                <PlayerRow key={i} player={p} isHome={false} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{ height: 12 }} />
    </div>
  );
}

/* ── Tab: Events Timeline ─────────────────────────────── */
function TabEvents({ data }) {
  const { events, fixture } = data;
  if (!events?.length) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        暂无事件数据
      </div>
    );
  }

  const homeName = fixture.home.originalName;

  return (
    <div style={{ padding: "12px 0" }}>
      {events.map((ev, i) => {
        const isHome = ev.team === homeName;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", padding: "8px 16px",
            borderBottom: "1px solid var(--border)",
          }}>
            {/* Home side */}
            <div style={{
              flex: 1, textAlign: "right", paddingRight: 12,
              opacity: isHome ? 1 : 0,
              visibility: isHome ? "visible" : "hidden",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>
                {ev.title}
              </div>
              {ev.assist && (
                <div style={{ fontSize: 10, color: "var(--text3)" }}>助攻: {ev.assist}</div>
              )}
              {ev.subtitle && (
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{ev.subtitle}</div>
              )}
            </div>

            {/* Center timeline */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              flexShrink: 0, width: 40,
            }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>{ev.icon}</span>
              <span style={{
                fontSize: 9, color: "var(--text3)", fontWeight: 700,
                fontVariantNumeric: "tabular-nums", marginTop: 2,
              }}>{ev.minuteLabel}</span>
            </div>

            {/* Away side */}
            <div style={{
              flex: 1, textAlign: "left", paddingLeft: 12,
              opacity: !isHome ? 1 : 0,
              visibility: !isHome ? "visible" : "hidden",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>
                {ev.title}
              </div>
              {ev.assist && (
                <div style={{ fontSize: 10, color: "var(--text3)" }}>助攻: {ev.assist}</div>
              )}
              {ev.subtitle && (
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{ev.subtitle}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Tab: H2H ────────────────────────────────────────── */
function TabH2H({ fixture, homeIso, awayIso }) {
  const { data: h2h, loading } = useH2H(homeIso, awayIso);

  if (loading) return <div style={{ padding: 24, textAlign: "center" }}><LoadingSpinner /></div>;
  if (!h2h) {
    return (
      <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        暂无历史对决数据
      </div>
    );
  }

  const summary = h2h.summary || {};
  const homeWins = summary[homeIso] ?? 0;
  const awayWins = summary[awayIso] ?? 0;
  const draws = summary.draws ?? 0;
  const total = homeWins + awayWins + draws;
  const matches = [...(h2h.matches || [])].reverse();

  const stageZh = {
    "group stage": "小组赛",
    "round of 16": "十六强",
    "quarter-finals": "八强",
    "semi-finals": "四强",
    "final": "决赛",
    "third-place match": "季军赛",
  };

  return (
    <div style={{ padding: "12px" }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[
          { value: homeWins, label: `${fixture.home.flag} ${fixture.home.name}胜`, color: "var(--blue)" },
          { value: draws, label: "平局", color: "var(--text3)" },
          { value: awayWins, label: `${fixture.away.flag} ${fixture.away.name}胜`, color: "var(--red)" },
        ].map((item, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center",
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "12px 4px",
          }}>
            <div style={{
              fontSize: 24, fontWeight: 900, color: item.color,
              fontVariantNumeric: "tabular-nums",
            }}>{item.value}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>
          世界杯历史 {total} 场交锋
        </div>
      )}

      {/* Match list */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 10, overflow: "hidden",
      }}>
        {matches.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
            两队此前从未在世界杯交手
          </div>
        ) : matches.map((match, i) => {
          let tone = "dim";
          if (match.winner === homeIso) tone = "blue";
          else if (match.winner === awayIso) tone = "red";

          const scoreStr = match.pen
            ? `${match.homeScore}-${match.awayScore} (${match.homePen}-${match.awayPen} 点)`
            : `${match.homeScore}-${match.awayScore}`;

          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              borderBottom: i < matches.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: 12, color: "var(--text3)", minWidth: 36 }}>
                {match.tournament.replace("WC-", "")}
              </span>
              <span style={{ flex: 1, fontSize: 11, color: "var(--text2)" }}>
                {stageZh[match.stage] || match.stage}
              </span>
              <span style={{ fontSize: 10, color: "var(--text3)", marginRight: 4 }}>
                {match.home} vs {match.away}
              </span>
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: tone === "blue" ? "var(--blue)" : tone === "red" ? "var(--red)" : "var(--text2)",
              }}>
                {scoreStr}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ height: 12 }} />
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────── */
export default function MatchDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const { data, loading } = useMatchDetail(id);
  const [tab, setTab] = useState("overview");

  const fixture = data?.fixture;
  const homeIso = useMemo(() => fixture ? nameToIso(fixture.home.originalName) : null, [fixture]);
  const awayIso = useMemo(() => fixture ? nameToIso(fixture.away.originalName) : null, [fixture]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", background: "var(--bg)" }}>
      {loading && !fixture && <LoadingSpinner />}

      {fixture && (
        <>
          <ScoreHeader fixture={fixture} onBack={() => router.back()} />

          {/* Goal scorers */}
          <GoalScorers events={data.events} fixture={fixture} />

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
            {tab === "overview" && <TabOverview data={data} />}
            {tab === "stats" && <TabStats data={data} />}
            {tab === "odds" && <TabOdds data={data} />}
            {tab === "lineups" && <TabLineups data={data} />}
            {tab === "events" && <TabEvents data={data} />}
            {tab === "h2h" && <TabH2H fixture={fixture} homeIso={homeIso} awayIso={awayIso} />}
          </div>
        </>
      )}
    </div>
  );
}
