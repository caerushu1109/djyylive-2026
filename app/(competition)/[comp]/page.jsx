"use client";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { useElo } from "@/lib/hooks/useElo";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { useTopScorers } from "@/lib/hooks/useTopScorers";
import { useTopAssists } from "@/lib/hooks/useTopAssists";
import { usePolymarket } from "@/lib/hooks/usePolymarket";
import OddsTicker from "@/components/shared/OddsTicker";
import MatchCard from "@/components/shared/MatchCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TopBar from "@/components/shared/TopBar";
import Countdown from "@/components/shared/Countdown";
import { PlayerProvider, useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";
import { useNewsDigest } from "@/lib/hooks/useNewsDigest";

const COMP_LABELS = { wc2026: "2026 WC" };
const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_STYLES = [
  { border: "1px solid var(--gold)", bg: "var(--gold-dim)", pctColor: "var(--gold)" },
  { border: "1px solid rgba(192,192,192,0.4)", bg: "rgba(192,192,192,0.05)", pctColor: "#bdbdbd" },
  { border: "1px solid rgba(205,127,50,0.4)", bg: "rgba(205,127,50,0.05)", pctColor: "#cd7f32" },
];
const RANK_LABELS = ["4th", "5th", "6th"];

function LiveBanner({ fixture }) {
  if (!fixture) return null;
  return (
    <div style={{
      margin: "0 12px 12px",
      background: "linear-gradient(135deg, #1a1f2e, #151922)",
      border: "1px solid rgba(255,61,61,0.25)",
      borderRadius: "var(--radius)", padding: "10px 12px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--live)", animation: "pulse 1.5s infinite", flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "0 10px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--live)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {fixture.stage || fixture.group || "世界杯"} ÷ {fixture.minute || "—"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>
          {fixture.home?.flag} {fixture.home?.name} vs {fixture.away?.flag} {fixture.away?.name}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: 20, fontWeight: 900, color: "var(--text)",
          letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", textAlign: "right",
        }}>
          {fixture.homeScore ?? 0}–{fixture.awayScore ?? 0}
        </div>
        <div style={{ fontSize: 10, color: "var(--live)", fontWeight: 700, textAlign: "right", marginTop: 2 }}>
          {fixture.minute || "—"}
        </div>
      </div>
    </div>
  );
}


function TournamentProgress({ fixturesData }) {
  const allFixtures = fixturesData?.fixtures || [];
  const total = allFixtures.length || 104; // 2026 WC = 104 matches
  const played = allFixtures.filter(f => f.status === "FT").length;
  const live = allFixtures.filter(f => f.status === "LIVE").length;
  const pct = total > 0 ? ((played + live) / total * 100) : 0;

  if (played === 0 && live === 0) return null;

  return (
    <div style={{
      margin: "0 12px 14px", background: "var(--card)",
      border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
      padding: "10px 12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          赛事进度
        </span>
        <span style={{ fontSize: 10, color: "var(--text3)", fontVariantNumeric: "tabular-nums" }}>
          {played}{live > 0 ? `+${live}` : ""}/{total} 场
        </span>
      </div>
      <div style={{ height: 6, background: "var(--card2)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg, var(--green), var(--blue))",
          width: `${pct}%`, transition: "width 0.5s",
        }} />
      </div>
    </div>
  );
}

const ALERT_TYPES = {
  injury:   { color: "#ff5252", label: "伤病" },
  squad:    { color: "#448aff", label: "名单" },
  result:   { color: "#4caf50", label: "赛果" },
  transfer: { color: "#ffb74d", label: "转会" },
  coach:    { color: "#ab47bc", label: "换帅" },
};

function digestTimeLabel(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const now = new Date();
  const diffH = Math.floor((now - d) / 3600000);
  if (diffH < 1) return "刚刚";
  if (diffH < 24) return `${diffH}h前`;
  return `${Math.floor(diffH / 24)}d前`;
}

function DigestSection() {
  const { data, loading } = useNewsDigest();
  const [copied, setCopied] = useState(false);

  if (loading || !data) return null;

  const { briefing, alerts = [], keyMatches = [], generatedAt, sources = [] } = data;
  if (!briefing) return null;

  const handleCopy = () => {
    const lines = [`DJYY 世界杯情报站`, "", briefing];
    if (alerts.length > 0) {
      lines.push("");
      alerts.forEach(a => lines.push(`· ${a.player || ""}（${a.team || ""}）${a.detail}`));
    }
    if (keyMatches.length > 0) {
      lines.push("");
      keyMatches.forEach(m => lines.push(`${m.home} vs ${m.away} — ${m.detail}`));
    }
    lines.push("", "djyylive.com");
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      margin: "0 12px 12px",
      background: "linear-gradient(168deg, rgba(25,32,48,0.95) 0%, rgba(15,18,28,0.98) 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      {/* Header — minimal, editorial */}
      <div style={{
        padding: "14px 14px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--green)", boxShadow: "0 0 6px rgba(76,175,80,0.5)",
          }} />
          <span style={{
            fontSize: 11, fontWeight: 800, color: "var(--text)",
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            DJYY 情报站
          </span>
        </div>
        <span style={{
          fontSize: 9, color: "var(--text3)", fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
        }}>
          {digestTimeLabel(generatedAt)}
        </span>
      </div>

      {/* Briefing — clean editorial text */}
      <div style={{ padding: "12px 14px 14px" }}>
        <p style={{
          margin: 0, fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,0.82)",
          fontWeight: 400,
        }}>
          {briefing}
        </p>
      </div>

      {/* Alerts — compact pill-style tags */}
      {alerts.length > 0 && (
        <div style={{
          padding: "0 14px 12px",
          display: "flex", flexDirection: "column", gap: 0,
        }}>
          {alerts.map((alert, i) => {
            const t = ALERT_TYPES[alert.type] || ALERT_TYPES.result;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "baseline", gap: 8,
                padding: "9px 0",
                borderTop: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: t.color,
                  letterSpacing: "0.04em",
                  width: 28, flexShrink: 0, textAlign: "right",
                }}>
                  {t.label}
                </span>
                <span style={{
                  width: 1, height: 12, background: "rgba(255,255,255,0.08)",
                  flexShrink: 0, alignSelf: "center",
                }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                  {alert.player && (
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{alert.player}</span>
                  )}
                  {alert.player && alert.team ? <span style={{ color: "var(--text3)" }}>{` · ${alert.team}`}</span> : ""}
                  {(alert.player || alert.team) && alert.detail ? " — " : ""}
                  {alert.detail}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Key Matches — clean rows */}
      {keyMatches.length > 0 && (
        <div style={{
          margin: "0 14px", padding: "10px 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {keyMatches.map((m, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center",
              padding: "6px 0",
            }}>
              <div style={{
                width: 3, height: 3, borderRadius: "50%",
                background: "var(--blue)", flexShrink: 0, marginRight: 10,
              }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
                {m.home} vs {m.away}
              </span>
              <span style={{
                fontSize: 11, color: "var(--text3)", marginLeft: 8,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {m.detail}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer — ultra minimal */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>
          {sources.join(" / ")}
        </span>
        <button
          onClick={handleCopy}
          style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 600,
            color: copied ? "var(--green)" : "rgba(255,255,255,0.5)",
            background: copied ? "rgba(76,175,80,0.12)" : "rgba(255,255,255,0.04)",
            border: "1px solid " + (copied ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.06)"),
            cursor: "pointer", transition: "all 0.2s",
            letterSpacing: "0.04em",
          }}
        >
          {copied ? "✓ 已复制" : "分享"}
        </button>
      </div>
    </div>
  );
}

function LeaderboardSection() {
  const { data: scorersData } = useTopScorers();
  const { data: assistsData } = useTopAssists();
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();
  const [tab, setTab] = useState("goals"); // "goals" | "assists"

  const players = tab === "goals"
    ? (scorersData?.scorers || [])
    : (assistsData?.assists || []);
  const isEmpty = players.length === 0;

  const handleClick = (p) => {
    const histId = lookup(p.playerNameEn || p.player);
    if (p.playerId || histId) openPlayer(String(p.playerId || histId), p.player, histId);
  };

  const mainLabel = tab === "goals" ? "进球" : "助攻";
  const subLabel  = tab === "goals" ? "助攻" : "进球";

  return (
    <div style={{
      margin: "0 12px 12px", background: "var(--card)",
      border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      {/* Tab header */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {[
          { id: "goals", label: "⚽ 射手榜" },
          { id: "assists", label: "🅰️ 助攻榜" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "10px 0", fontSize: 12, fontWeight: 700,
              color: t.id === tab ? "var(--blue)" : "var(--text3)",
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottom: t.id === tab ? "2px solid var(--blue)" : "2px solid transparent",
              background: "none", cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isEmpty ? (
        /* Pre-tournament empty state */
        <div style={{ padding: "32px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{tab === "goals" ? "⚽" : "🅰️"}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>
            {tab === "goals" ? "射手榜" : "助攻榜"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>开赛后自动更新</div>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: "flex", alignItems: "center", padding: "6px 10px",
            background: "var(--card2)", fontSize: 9, fontWeight: 700, color: "var(--text3)",
          }}>
            <span style={{ width: 26, textAlign: "center" }}>#</span>
            <span style={{ flex: 1 }}>球员</span>
            <span style={{ width: 30, textAlign: "center" }}>场</span>
            <span style={{ width: 30, textAlign: "center" }}>{mainLabel}</span>
            <span style={{ width: 30, textAlign: "center" }}>{subLabel}</span>
            <span style={{ width: 34, textAlign: "center" }}>xG</span>
            <span style={{ width: 34, textAlign: "center" }}>±xG</span>
          </div>
          {/* Player rows */}
          {players.map((p, i) => {
            const meta = p.teamMeta || {};
            const mainStat = tab === "goals" ? p.goals : p.assists;
            const subStat  = tab === "goals" ? p.assists : p.goals;
            const xg = p.xg ?? "—";
            const xgDiff = (p.xg != null && mainStat != null) ? (mainStat - p.xg).toFixed(1) : "—";
            const isTop3 = i < 3;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", padding: "7px 10px",
                borderBottom: i < players.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <span style={{
                  width: 26, textAlign: "center", fontSize: 11, fontWeight: 800,
                  color: isTop3 ? "var(--blue)" : "var(--text3)",
                }}>
                  {isTop3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                </span>
                <div
                  onClick={() => handleClick(p)}
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                >
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{p.player}</div>
                  <div style={{ fontSize: 9, color: "var(--text3)", display: "flex", alignItems: "center", gap: 3 }}>
                    <span>{meta.flag || p.flag}</span>
                    <span>{meta.shortName || p.team}</span>
                  </div>
                </div>
                <span style={{ width: 30, textAlign: "center", fontSize: 10, color: "var(--text2)", fontVariantNumeric: "tabular-nums" }}>
                  {p.matches}
                </span>
                <span style={{ width: 30, textAlign: "center", fontSize: 13, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                  {mainStat}
                </span>
                <span style={{ width: 30, textAlign: "center", fontSize: 10, color: "var(--text2)", fontVariantNumeric: "tabular-nums" }}>
                  {subStat}
                </span>
                <span style={{ width: 34, textAlign: "center", fontSize: 10, color: "var(--text3)", fontVariantNumeric: "tabular-nums" }}>
                  {typeof xg === "number" ? xg.toFixed(1) : xg}
                </span>
                <span style={{
                  width: 34, textAlign: "center", fontSize: 10, fontVariantNumeric: "tabular-nums",
                  color: xgDiff === "—" ? "var(--text3)" : Number(xgDiff) > 0 ? "var(--green)" : Number(xgDiff) < 0 ? "var(--red)" : "var(--text3)",
                }}>
                  {xgDiff === "—" ? "—" : (Number(xgDiff) > 0 ? "+" : "") + xgDiff}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function todayFixtures(fixtures) {
  if (!fixtures?.length) return [];
  const todayBJT = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
  return fixtures.filter(f => {
    if (!f.startingAt) return false;
    const fDateBJT = new Date(f.startingAt).toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
    return fDateBJT === todayBJT;
  });
}

export default function CompHomePage() {
  return (
    <PlayerProvider>
      <CompHomePageInner />
    </PlayerProvider>
  );
}

function CompHomePageInner() {
  const { comp } = useParams();

  const { data: fixturesData, loading: fixturesLoading } = useFixtures({ pollInterval: 30000 });
  const { data: eloData } = useElo();
  const { data: predData } = usePredictions();
  const { data: polyData } = usePolymarket();
  // Helper: resolve English originalName for team detail navigation
  const getTeamHref = (team) => {
    const eloTeam = (eloData?.rankings || []).find(
      r => r.code === team.code || r.name === team.name
    );
    return `/team/${encodeURIComponent(eloTeam?.originalName || team.originalName || team.name)}`;
  };

  const liveFixtures = fixturesData?.fixtures?.filter(f => f.status === "LIVE") || [];
  const todayList    = todayFixtures(fixturesData?.fixtures || []);
  const upcomingList = useMemo(() => {
    if (todayList.length > 0) return [];
    const now = new Date();
    return (fixturesData?.fixtures || [])
      .filter(f => f.startingAt && new Date(f.startingAt) > now)
      .sort((a, b) => new Date(a.startingAt) - new Date(b.startingAt))
      .slice(0, 3);
  }, [todayList, fixturesData]);
  const displayFixtures  = todayList.length > 0 ? todayList : upcomingList;
  const fixtureLabel     = todayList.length > 0 ? "今日赛程" : "最近赛程";
  const top6       = (predData?.teams || []).filter(t => !t.placeholder).slice(0, 6);
  const top3       = top6.slice(0, 3);
  const next3      = top6.slice(3, 6);

  return (
    <div>
      <TopBar comp={comp} badge />
      <Countdown />

      {liveFixtures.length > 0 && <LiveBanner fixture={liveFixtures[0]} />}

      <OddsTicker polyData={polyData} />
      <TournamentProgress fixturesData={fixturesData} />

      <div style={{ padding: "0 12px", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{fixtureLabel}</span>
        <Link href={`/${comp}/fixtures`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>全部 →</Link>
      </div>
      {fixturesLoading ? (
        <LoadingSpinner />
      ) : displayFixtures.length === 0 ? (
        <p style={{ padding: "0 12px", color: "var(--text2)", fontSize: 13 }}>暂无赛程数据</p>
      ) : (
        displayFixtures.map(f => <MatchCard key={f.id} fixture={f} predictions={predData?.teams} showVenue />)
      )}

      {/* ELO Top 6 */}
      {top3.length > 0 && (
        <div style={{
          margin: "0 12px 12px", background: "var(--card)",
          border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              夺冠热门 · ELO模型
            </span>
            <Link href={`/${comp}/predict`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>完整榜 →</Link>
          </div>
          <div style={{ display: "flex", padding: "10px 8px 8px", gap: 6 }}>
            {top3.map((team, i) => (
              <Link key={team.code} href={getTeamHref(team)} style={{
                flex: 1, background: MEDAL_STYLES[i].bg, border: MEDAL_STYLES[i].border,
                borderRadius: "var(--radius-sm)", padding: 8, textAlign: "center",
                textDecoration: "none", display: "block",
              }}>
                <div style={{ fontSize: 14 }}>{MEDALS[i]}</div>
                <span style={{ fontSize: 20, display: "block", margin: "4px 0" }}>{team.flag}</span>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{team.name}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: MEDAL_STYLES[i].pctColor, marginTop: 2 }}>
                  {team.probabilityValue !== undefined ? `${team.probabilityValue.toFixed(1)}%` : "—"}
                </div>
              </Link>
            ))}
          </div>
          {next3.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "4px 8px 10px" }}>
              {next3.map((team, i) => (
                <Link key={team.code} href={getTeamHref(team)} style={{
                  display: "flex", alignItems: "center", padding: "6px 4px", gap: 8,
                  borderBottom: i < next3.length - 1 ? "1px solid var(--border)" : "none",
                  textDecoration: "none",
                }}>
                  <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, width: 16, textAlign: "center", flexShrink: 0 }}>{i + 4}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{team.flag}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", flex: 1 }}>{team.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", fontVariantNumeric: "tabular-nums" }}>
                    {team.probabilityValue !== undefined ? `${team.probabilityValue.toFixed(1)}%` : "—"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <DigestSection />

      <LeaderboardSection />

      <div style={{ height: 72 }} />
    </div>
  );
}
