"use client";

import { MapPin, Users, Landmark, Leaf } from "lucide-react";
import SectionLabel from "./SectionLabel";
import WinProbBar from "./WinProbBar";
import CompactModelSummary from "./CompactModelSummary";
import H2HSummaryCard from "./H2HSummaryCard";
import { KeyStatPill } from "./StatBar";
import TeamLogo from "@/components/shared/TeamLogo";

/* ── Pre-Match: Team Comparison ────────────────────── */
function TeamComparisonCard({ homePred, awayPred, fixture }) {
  if (!homePred || !awayPred) return null;

  const rows = [
    { label: "ELO", home: homePred.elo, away: awayPred.elo },
    { label: "世界排名", home: `#${homePred.rank}`, away: `#${awayPred.rank}` },
    { label: "夺冠概率", home: homePred.titleProbability, away: awayPred.titleProbability },
    { label: "出线概率", home: `${homePred.pQualify}%`, away: `${awayPred.pQualify}%` },
  ];

  return (
    <div style={{
      background: "var(--card)", borderRadius: 10,
      border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
    }}>
      <div style={{ padding: "10px 14px 8px" }}>
        <SectionLabel>球队对比</SectionLabel>
      </div>
      {/* Team headers */}
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "0 14px 8px",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>
          <TeamLogo logo={fixture.home.logo} flag={fixture.home.flag} size={16} /> {fixture.home.name}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "var(--red)" }}>
          {fixture.away.name} <TeamLogo logo={fixture.away.logo} flag={fixture.away.flag} size={16} />
        </span>
      </div>
      {rows.map((row, i) => {
        const homeNum = typeof row.home === "number" ? row.home : parseFloat(String(row.home).replace(/[^0-9.]/g, ""));
        const awayNum = typeof row.away === "number" ? row.away : parseFloat(String(row.away).replace(/[^0-9.]/g, ""));
        const isRank = row.label === "世界排名";
        const homeHighlight = !isNaN(homeNum) && !isNaN(awayNum) && (isRank ? homeNum < awayNum : homeNum > awayNum);
        const awayHighlight = !isNaN(homeNum) && !isNaN(awayNum) && (isRank ? awayNum < homeNum : awayNum > homeNum);
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "8px 14px",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{
              flex: 1, fontSize: 13, fontWeight: homeHighlight ? 800 : 600,
              color: homeHighlight ? "var(--blue)" : "var(--text2)",
              fontVariantNumeric: "tabular-nums",
            }}>{row.home}</span>
            <span style={{
              fontSize: 10, color: "var(--text3)", fontWeight: 600, textAlign: "center",
              minWidth: 60,
            }}>{row.label}</span>
            <span style={{
              flex: 1, fontSize: 13, fontWeight: awayHighlight ? 800 : 600,
              color: awayHighlight ? "var(--red)" : "var(--text2)",
              fontVariantNumeric: "tabular-nums", textAlign: "right",
            }}>{row.away}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Pre-Match: Match Info ─────────────────────────── */
function MatchInfoCard({ fixture }) {
  const kickoffDate = fixture.startingAt ? new Date(fixture.startingAt) : null;
  const bjTime = kickoffDate && !isNaN(kickoffDate)
    ? kickoffDate.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
    : fixture.kickoff || null;

  const infoItems = [
    bjTime && { label: "开球时间", value: `${bjTime} (北京时间)` },
    fixture.group && { label: "小组", value: fixture.group },
    fixture.stage && { label: "阶段", value: fixture.stage },
  ].filter(Boolean);

  if (!infoItems.length && !fixture.venueDetail) return null;

  return (
    <div style={{
      background: "var(--card)", borderRadius: 10,
      border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
    }}>
      <div style={{ padding: "10px 14px 8px" }}>
        <SectionLabel>{"比赛信息"}</SectionLabel>
      </div>
      {infoItems.map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", padding: "8px 14px",
          borderTop: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, width: 60, flexShrink: 0 }}>
            {item.label}
          </span>
          <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, flex: 1 }}>
            {item.value}
          </span>
        </div>
      ))}
      {/* Venue card with photo */}
      <VenueCard fixture={fixture} />
    </div>
  );
}

/* ── Venue Info Card ─────────────────────────────── */
function VenueCard({ fixture }) {
  const v = fixture.venueDetail;
  const venueName = v?.name || fixture.venue;
  if (!venueName) return null;

  const surfaceZh = {
    grass: "天然草地",
    artificial: "人工草地",
    synthetic: "人工草地",
    hybrid: "混合草地",
  };

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      {/* Venue photo */}
      {v?.image && (
        <div style={{ position: "relative", width: "100%", height: 120, overflow: "hidden" }}>
          <img
            src={v.image}
            alt={venueName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
            padding: "16px 14px 8px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>
              <Landmark size={13} strokeWidth={2} /> {venueName}
            </div>
          </div>
        </div>
      )}
      {/* Venue details row */}
      <div style={{
        display: "flex", gap: 12, padding: "8px 14px",
        flexWrap: "wrap",
      }}>
        {!v?.image && (
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", flex: "1 0 100%", marginBottom: 2, display: "flex", alignItems: "center", gap: 5 }}>
            <Landmark size={13} strokeWidth={2} /> {venueName}
          </div>
        )}
        {v?.city && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={10} strokeWidth={2} color="var(--text3)" />
            <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>{v.city}</span>
          </div>
        )}
        {v?.capacity && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={10} strokeWidth={2} color="var(--text3)" />
            <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
              {Number(v.capacity).toLocaleString()}
            </span>
          </div>
        )}
        {v?.surface && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Leaf size={10} strokeWidth={2} color="var(--text3)" />
            <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
              {surfaceZh[v.surface.toLowerCase()] || v.surface}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TabOverview({ data, onPlayerClick, predictionsTeams, h2hData, homeIso, awayIso, poissonOdds, liveOdds, onSwitchTab }) {
  const { stats, events, fixture, predictions } = data;

  if (fixture.status === "NS") {
    const homePred = predictionsTeams?.find(t => t.name === fixture.home.name || t.code === homeIso?.toUpperCase());
    const awayPred = predictionsTeams?.find(t => t.name === fixture.away.name || t.code === awayIso?.toUpperCase());

    return (
      <div style={{ padding: "12px 12px 0" }}>
        {/* Compact model summary with link to analysis tab */}
        <CompactModelSummary poissonOdds={poissonOdds} fixture={fixture} onSwitchTab={onSwitchTab} />

        {/* Team Comparison */}
        <TeamComparisonCard homePred={homePred} awayPred={awayPred} fixture={fixture} />

        {/* Match Info */}
        <MatchInfoCard fixture={fixture} />

        {/* H2H Summary */}
        <H2HSummaryCard h2h={h2hData} fixture={fixture} homeIso={homeIso} awayIso={awayIso} />

        {/* Fallback if nothing available */}
        {!poissonOdds && !homePred && !awayPred && !h2hData && (
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
      {/* Live probability bar (Poisson in-play model) */}
      {fixture.status === "LIVE" && liveOdds && (
        <div style={{
          background: "var(--card)", borderRadius: 10, padding: "10px 14px",
          border: "1px solid rgba(255,61,61,0.2)", marginBottom: 12,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
          }}>
            <span style={{
              width: 6, height: 6, background: "var(--live)", borderRadius: "50%",
              animation: "pulse 1.5s infinite", display: "inline-block",
            }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--live)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {"实时概率"} {fixture.minute}
            </span>
          </div>
          <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ flex: liveOdds.result.homeWin, background: "var(--blue)", borderRadius: "6px 0 0 6px" }} />
            <div style={{ flex: liveOdds.result.draw, background: "var(--text3)" }} />
            <div style={{ flex: liveOdds.result.awayWin, background: "var(--red)", borderRadius: "0 6px 6px 0" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--blue)" }}>{liveOdds.result.homeWin}%</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>{fixture.home.name}{"胜"}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text3)" }}>{liveOdds.result.draw}%</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>{"平局"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--red)" }}>{liveOdds.result.awayWin}%</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>{fixture.away.name}{"胜"}</div>
            </div>
          </div>
        </div>
      )}

      {/* SportMonks AI Predictions */}
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
                {ev.teamMeta?.flag}{" "}
                <span onClick={() => onPlayerClick?.(ev.title)} style={{ cursor: "pointer" }}>{ev.title}</span>
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
