"use client";
import Link from "next/link";

/**
 * KnockoutBracket — 2026 FIFA World Cup 淘汰赛对阵树
 *
 * 横向可滚动，从左（32强）到右（决赛）。
 * 赛前：显示 "1A / 2B" 资格标签（灰色占位）
 * 赛中/赛后：从 fixtures prop 自动匹配真实球队，每场比赛可点击跳转详情
 */

// ── 淘汰赛对阵模板（FIFA 2026 WC 官方赛制） ───────────────────────────────────
const R32 = [
  { id: "M49",  home: "1A",  away: "2B"  },
  { id: "M50",  home: "1C",  away: "Q3a" },
  { id: "M51",  home: "1B",  away: "Q3b" },
  { id: "M52",  home: "1D",  away: "2A"  },
  { id: "M53",  home: "1E",  away: "2F"  },
  { id: "M54",  home: "1G",  away: "Q3c" },
  { id: "M55",  home: "1F",  away: "Q3d" },
  { id: "M56",  home: "1H",  away: "2E"  },
  { id: "M57",  home: "1I",  away: "2J"  },
  { id: "M58",  home: "1K",  away: "Q3e" },
  { id: "M59",  home: "1J",  away: "Q3f" },
  { id: "M60",  home: "1L",  away: "2I"  },
  { id: "M61",  home: "2G",  away: "2H"  },
  { id: "M62",  home: "2K",  away: "Q3g" },
  { id: "M63",  home: "2L",  away: "Q3h" },
  { id: "M64",  home: "1H",  away: "2G"  },
];

const R16  = Array.from({ length: 8 }, (_, i) => ({ id: `R16-${i+1}`, home: `W${R32[i*2].id}`,  away: `W${R32[i*2+1].id}` }));
const QF   = Array.from({ length: 4 }, (_, i) => ({ id: `QF-${i+1}`,  home: `W${R16[i*2].id}`, away: `W${R16[i*2+1].id}` }));
const SF   = Array.from({ length: 2 }, (_, i) => ({ id: `SF-${i+1}`,  home: `W${QF[i*2].id}`,  away: `W${QF[i*2+1].id}`  }));
const FIN  = [{ id: "Final", home: `W${SF[0].id}`, away: `W${SF[1].id}` }];

const ROUNDS = [
  { key: "r32",   label: "32强",  matches: R32  },
  { key: "r16",   label: "16强",  matches: R16  },
  { key: "qf",    label: "八强赛", matches: QF   },
  { key: "sf",    label: "四强赛", matches: SF   },
  { key: "final", label: "决赛",  matches: FIN  },
];

// ── 尺寸常量 ─────────────────────────────────────────────────────────────────
const SLOT_H  = 44;
const MATCH_H = SLOT_H * 2 + 1;
const COL_W   = 110;

function roundTopPad(roundIndex) {
  if (roundIndex === 0) return 0;
  return (Math.pow(2, roundIndex) - 1) * (MATCH_H + 4) / 2;
}
function roundMatchGap(roundIndex) {
  if (roundIndex === 0) return 4;
  return Math.pow(2, roundIndex) * (MATCH_H + 4) - MATCH_H;
}

// ── 单个球队行 ────────────────────────────────────────────────────────────────
function TeamRow({ label, flag, name, score, isWinner, isLive }) {
  const hasTeam = !!name;
  return (
    <div style={{
      height: SLOT_H,
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "0 8px",
      background: isWinner ? "rgba(92,158,255,0.1)" : "transparent",
      position: "relative",
    }}>
      {hasTeam ? (
        <>
          <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1 }}>{flag || "🏳️"}</span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: isWinner ? "var(--blue)" : "var(--text)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            flex: 1, maxWidth: 58,
          }}>
            {name}
          </span>
          {score != null && (
            <span style={{
              fontSize: 12, fontWeight: 900,
              color: isWinner ? "var(--blue)" : isLive ? "var(--live)" : "var(--text2)",
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}>
              {score}
            </span>
          )}
        </>
      ) : (
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)" }}>
          {label || "待定"}
        </span>
      )}
    </div>
  );
}

// ── 单场比赛卡片 ──────────────────────────────────────────────────────────────
function MatchCard({ match, roundIndex }) {
  const isFinal   = roundIndex === 4;
  const isLive    = match.status === "LIVE";
  const hasResult = match.homeScore != null || match.awayScore != null;
  const fixtureId = match.fixtureId;

  const card = (
    <div style={{
      width: COL_W,
      background: "var(--card)",
      border: `1px solid ${
        isFinal  ? "rgba(255,193,7,0.45)" :
        isLive   ? "rgba(255,61,61,0.35)" :
        "var(--border)"
      }`,
      borderRadius: 8,
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: isFinal ? "0 0 14px rgba(255,193,7,0.1)" : "none",
      cursor: fixtureId ? "pointer" : "default",
    }}>
      {/* Live indicator */}
      {isLive && (
        <div style={{
          height: 2,
          background: "var(--live)",
        }} />
      )}

      <TeamRow
        label={match.home}
        flag={match.homeTeam?.flag}
        name={match.homeTeam?.name}
        score={match.homeScore}
        isWinner={match.winner === "home"}
        isLive={isLive}
      />
      <div style={{ height: 1, background: "var(--border)", margin: "0 8px" }} />
      <TeamRow
        label={match.away}
        flag={match.awayTeam?.flag}
        name={match.awayTeam?.name}
        score={match.awayScore}
        isWinner={match.winner === "away"}
        isLive={isLive}
      />

      {/* Match status badge at bottom */}
      {hasResult && !isLive && (
        <div style={{
          textAlign: "center", fontSize: 8, fontWeight: 700,
          color: "var(--text3)", padding: "2px 0 3px",
          borderTop: "1px solid var(--border)",
          letterSpacing: "0.05em",
        }}>
          终场
        </div>
      )}
      {isLive && (
        <div style={{
          textAlign: "center", fontSize: 8, fontWeight: 700,
          color: "var(--live)", padding: "2px 0 3px",
          borderTop: "1px solid rgba(255,61,61,0.2)",
          letterSpacing: "0.05em",
        }}>
          ● 直播中
        </div>
      )}
    </div>
  );

  if (fixtureId) {
    return (
      <Link href={`/match/${fixtureId}`} style={{ textDecoration: "none", display: "block" }}>
        {card}
      </Link>
    );
  }
  return card;
}

// ── 连接线 ────────────────────────────────────────────────────────────────────
function ConnectorLines({ pairHeight }) {
  const mid = pairHeight / 2;
  const top1 = MATCH_H / 2;
  const bot1 = pairHeight - MATCH_H / 2;
  return (
    <div style={{ width: 10, position: "relative", alignSelf: "stretch", flexShrink: 0 }}>
      {/* 上竖线 */}
      <div style={{ position: "absolute", left: 0, top: top1, width: 1, height: mid - top1, background: "var(--border2)" }} />
      {/* 下竖线 */}
      <div style={{ position: "absolute", left: 0, top: mid, width: 1, height: bot1 - mid, background: "var(--border2)" }} />
      {/* 横线 */}
      <div style={{ position: "absolute", left: 0, top: mid, width: 10, height: 1, background: "var(--border2)" }} />
    </div>
  );
}

// ── 从 fixtures 数据匹配真实球队到对阵格子 ────────────────────────────────────
function enrichMatchesFromFixtures(fixtures) {
  if (!fixtures?.length) return {};

  // 尝试按 Sportmonks matchday / stage 名称匹配
  const stageKeywords = {
    r32:   ["round of 32", "32", "第三十二"],
    r16:   ["round of 16", "16", "第十六"],
    qf:    ["quarter", "四分之一", "八强", "quarterfinal"],
    sf:    ["semi", "半决赛", "semifinal"],
    final: ["final", "决赛"],
  };

  const byStage = {};
  fixtures.forEach(f => {
    const stage = (f.stage || f.round || "").toLowerCase();
    for (const [key, keywords] of Object.entries(stageKeywords)) {
      if (keywords.some(k => stage.includes(k))) {
        if (!byStage[key]) byStage[key] = [];
        byStage[key].push(f);
        break;
      }
    }
  });

  // Build lookup: round key → ordered fixture list
  return byStage;
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function KnockoutBracket({ fixtures = [] }) {
  const fixturesByStage = enrichMatchesFromFixtures(fixtures);

  // Merge real fixture data into the template matches
  const enrichedRounds = ROUNDS.map(round => {
    const stageFix = fixturesByStage[round.key] || [];
    return {
      ...round,
      matches: round.matches.map((match, i) => {
        const fix = stageFix[i];
        if (!fix) return match;
        return {
          ...match,
          fixtureId:  fix.id,
          status:     fix.status,
          homeScore:  fix.homeScore ?? null,
          awayScore:  fix.awayScore ?? null,
          winner:     fix.homeScore != null && fix.awayScore != null
            ? fix.homeScore > fix.awayScore ? "home"
            : fix.awayScore > fix.homeScore ? "away" : null
            : null,
          homeTeam: fix.home ? { name: fix.home.name, flag: fix.home.flag } : undefined,
          awayTeam: fix.away ? { name: fix.away.name, flag: fix.away.flag } : undefined,
        };
      }),
    };
  });

  return (
    <div style={{ overflowX: "auto", overflowY: "visible", scrollbarWidth: "none", paddingBottom: 16 }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "12px 12px 0",
        width: "max-content",
      }}>
        {enrichedRounds.map((round, roundIndex) => {
          const topPad  = roundTopPad(roundIndex);
          const matchGap = roundMatchGap(roundIndex);
          const pairH   = MATCH_H * 2 + matchGap; // height spanning two sibling matches

          return (
            <div key={round.key} style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
              {/* Column */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Round label */}
                <div style={{
                  height: 22,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 800,
                  color: round.key === "final" ? "var(--gold)" : "var(--blue)",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  marginBottom: 6,
                }}>
                  {round.label}
                </div>

                {/* Match cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: matchGap, paddingTop: topPad }}>
                  {round.matches.map(match => (
                    <MatchCard key={match.id} match={match} roundIndex={roundIndex} />
                  ))}
                </div>
              </div>

              {/* Connector lines to next round (skip after Final) */}
              {roundIndex < ROUNDS.length - 1 && (
                <div style={{
                  display: "flex", flexDirection: "column",
                  paddingTop: topPad + 22 + 6,
                  gap: matchGap,
                  flexShrink: 0,
                }}>
                  {round.matches.map((_, mi) => {
                    if (mi % 2 !== 0) return null;
                    return (
                      <div key={mi} style={{ height: pairH, position: "relative" }}>
                        <ConnectorLines pairHeight={pairH} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ padding: "10px 12px 4px", fontSize: 9, color: "var(--text3)", lineHeight: 1.6 }}>
        Q3a–h = 各组最佳第3名晋级席位 · 对阵将在小组赛结束后由FIFA公布 · 点击卡片查看比赛详情
      </div>
    </div>
  );
}
