"use client";
import Link from "next/link";

/**
 * KnockoutBracket — 2026 FIFA World Cup 淘汰赛对阵树
 *
 * 用绝对定位精确计算每张卡片的 Y 坐标，避免 flex 嵌套导致的布局失效。
 * 公式：第 r 轮（0=R32）第 i 场的中心 Y = UNIT * 2^r * (i + 0.5)
 */

// ── 2026 WC 淘汰赛模板 ────────────────────────────────────────────────────────
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
  { id: "M64",  home: "1K",  away: "2L"  },
];
const R16  = Array.from({ length: 8 }, (_, i) => ({ id: `R16-${i+1}`, home: `W${R32[i*2].id}`,  away: `W${R32[i*2+1].id}` }));
const QF   = Array.from({ length: 4 }, (_, i) => ({ id: `QF-${i+1}`,  home: `W${R16[i*2].id}`, away: `W${R16[i*2+1].id}` }));
const SF   = Array.from({ length: 2 }, (_, i) => ({ id: `SF-${i+1}`,  home: `W${QF[i*2].id}`,  away: `W${QF[i*2+1].id}`  }));
const FIN  = [{ id: "Final", home: `W${SF[0].id}`, away: `W${SF[1].id}` }];
const TPP  = [{ id: "3rd",   home: `L${SF[0].id}`, away: `L${SF[1].id}` }];

const ROUNDS = [
  { key: "r32",   label: "32强",  matches: R32  },
  { key: "r16",   label: "16强",  matches: R16  },
  { key: "qf",    label: "八强赛", matches: QF   },
  { key: "sf",    label: "四强赛", matches: SF   },
  { key: "final", label: "决赛",  matches: FIN  },
];

// ── 布局常量 ─────────────────────────────────────────────────────────────────
// COL_W=64, CON_W=6 → totalW = 5×64 + 4×6 = 344px，适配 375px 无需横滑
const SLOT_H     = 32;           // 每队行高
const MATCH_H    = SLOT_H * 2 + 1; // 一场比赛高度 (65px)
const COL_W      = 64;           // 列宽（缩小以适配手机屏幕）
const CON_W      = 6;            // 连接线宽
const LABEL_H    = 24;           // 轮次标签高
const N          = 16;           // R32 场次数
const UNIT       = 72;           // R32 每场占用的高度单元（含间距）
const BRACKET_H  = N * UNIT;     // 总高度 1152px

// 第 roundIndex 轮、第 matchIndex 场的 中心Y（相对内容区顶部）
function centerY(roundIndex, matchIndex) {
  return UNIT * Math.pow(2, roundIndex) * (matchIndex + 0.5);
}
// 卡片顶部 Y
function cardTop(roundIndex, matchIndex) {
  return centerY(roundIndex, matchIndex) - MATCH_H / 2;
}

// ── 球队行 ────────────────────────────────────────────────────────────────────
function TeamRow({ label, flag, name, score, isWinner, isLive }) {
  return (
    <div style={{
      height: SLOT_H,
      display: "flex",
      alignItems: "center",
      gap: 3,
      padding: "0 5px",
      background: isWinner ? "rgba(92,158,255,0.10)" : "transparent",
    }}>
      {name ? (
        <>
          <span style={{ fontSize: 12, flexShrink: 0, lineHeight: 1 }}>{flag || "🏳️"}</span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: isWinner ? "var(--blue)" : "var(--text)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            flex: 1,
          }}>{name}</span>
          {score != null && (
            <span style={{
              fontSize: 10, fontWeight: 900, flexShrink: 0,
              color: isWinner ? "var(--blue)" : isLive ? "var(--live)" : "var(--text2)",
              fontVariantNumeric: "tabular-nums",
            }}>{score}</span>
          )}
        </>
      ) : (
        <span style={{ fontSize: 8, fontWeight: 600, color: "var(--text3)" }}>
          {label || "待定"}
        </span>
      )}
    </div>
  );
}

// ── 比赛卡 ────────────────────────────────────────────────────────────────────
function MatchCard({ match, roundIndex, top }) {
  const isFinal = roundIndex === 4;
  const isLive  = match.status === "LIVE";
  const hasRes  = match.homeScore != null && match.awayScore != null;
  const winner  = hasRes
    ? match.homeScore > match.awayScore ? "home"
    : match.awayScore > match.homeScore ? "away" : null
    : null;

  const inner = (
    <div style={{
      position: "absolute",
      top,
      left: 0,
      width: COL_W,
      background: "var(--card)",
      border: `1px solid ${isFinal ? "rgba(255,193,7,0.5)" : isLive ? "rgba(255,61,61,0.35)" : "var(--border)"}`,
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: isFinal ? "0 0 16px rgba(255,193,7,0.12)" : "none",
    }}>
      {isLive && <div style={{ height: 2, background: "var(--live)" }} />}
      <TeamRow
        label={match.home}
        flag={match.homeTeam?.flag}
        name={match.homeTeam?.name}
        score={match.homeScore}
        isWinner={winner === "home"}
        isLive={isLive}
      />
      <div style={{ height: 1, background: "var(--border)", margin: "0 7px" }} />
      <TeamRow
        label={match.away}
        flag={match.awayTeam?.flag}
        name={match.awayTeam?.name}
        score={match.awayScore}
        isWinner={winner === "away"}
        isLive={isLive}
      />
      {hasRes && !isLive && (
        <div style={{
          fontSize: 8, fontWeight: 700, color: "var(--text3)",
          textAlign: "center", padding: "2px 0 3px",
          borderTop: "1px solid var(--border)", letterSpacing: "0.05em",
        }}>终场</div>
      )}
      {isLive && (
        <div style={{
          fontSize: 8, fontWeight: 700, color: "var(--live)",
          textAlign: "center", padding: "2px 0 3px",
          borderTop: "1px solid rgba(255,61,61,0.2)", letterSpacing: "0.05em",
        }}>● 直播中</div>
      )}
    </div>
  );

  return match.fixtureId
    ? <Link href={`/match/${match.fixtureId}`} style={{ textDecoration: "none" }}>{inner}</Link>
    : inner;
}

// ── 连接线（SVG，精确连两张卡到下一张卡） ─────────────────────────────────────
function Connectors({ roundIndex, matchCount }) {
  const lines = [];
  for (let i = 0; i < matchCount; i += 2) {
    const y1 = centerY(roundIndex, i);       // 上方卡中心
    const y2 = centerY(roundIndex, i + 1);   // 下方卡中心
    const yM = (y1 + y2) / 2;                // 连接点（即下一轮卡中心）
    // 上竖线
    lines.push(<line key={`v1-${i}`} x1={0} y1={y1} x2={0} y2={yM} />);
    // 下竖线
    lines.push(<line key={`v2-${i}`} x1={0} y1={yM} x2={0} y2={y2} />);
    // 横线
    lines.push(<line key={`h-${i}`}  x1={0} y1={yM} x2={CON_W} y2={yM} />);
  }
  return (
    <svg
      width={CON_W}
      height={BRACKET_H}
      style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
      stroke="var(--border2)"
      strokeWidth={1}
      fill="none"
    >
      {lines}
    </svg>
  );
}

// ── 从 fixtures 匹配淘汰赛数据 ────────────────────────────────────────────────
function enrichRounds(fixtures) {
  if (!fixtures?.length) return ROUNDS;

  const stageMap = {
    r32:   ["round of 32"],
    r16:   ["round of 16"],
    qf:    ["quarter"],
    sf:    ["semi"],
    final: ["final"],
    tpp:   ["third", "3rd place", "third place"],
  };

  const byStage = {};
  fixtures.forEach(f => {
    const stage = (f.stage || f.round || "").toLowerCase();
    for (const [key, kws] of Object.entries(stageMap)) {
      if (kws.some(k => stage.includes(k))) {
        (byStage[key] = byStage[key] || []).push(f);
        break;
      }
    }
  });

  return ROUNDS.map(round => ({
    ...round,
    matches: round.matches.map((match, i) => {
      const fix = (byStage[round.key] || [])[i];
      if (!fix) return match;
      return {
        ...match,
        fixtureId: fix.id,
        status:    fix.status,
        homeScore: fix.homeScore ?? null,
        awayScore: fix.awayScore ?? null,
        homeTeam:  fix.home ? { name: fix.home.name, flag: fix.home.flag } : undefined,
        awayTeam:  fix.away ? { name: fix.away.name, flag: fix.away.flag } : undefined,
      };
    }),
  }));
}

// ── 三四名决赛卡（独立渲染，不在树状图列内） ─────────────────────────────────
function ThirdPlaceCard({ match }) {
  const isLive  = match.status === "LIVE";
  const hasRes  = match.homeScore != null && match.awayScore != null;
  const winner  = hasRes
    ? match.homeScore > match.awayScore ? "home"
    : match.awayScore > match.homeScore ? "away" : null
    : null;

  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid rgba(92,158,255,0.25)",
      borderRadius: 8,
      overflow: "hidden",
      width: COL_W * 2 + CON_W,
    }}>
      {isLive && <div style={{ height: 2, background: "var(--live)" }} />}
      <TeamRow
        label={match.home}
        flag={match.homeTeam?.flag}
        name={match.homeTeam?.name}
        score={match.homeScore}
        isWinner={winner === "home"}
        isLive={isLive}
      />
      <div style={{ height: 1, background: "var(--border)", margin: "0 7px" }} />
      <TeamRow
        label={match.away}
        flag={match.awayTeam?.flag}
        name={match.awayTeam?.name}
        score={match.awayScore}
        isWinner={winner === "away"}
        isLive={isLive}
      />
      {hasRes && !isLive && (
        <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text3)", textAlign: "center", padding: "2px 0 3px", borderTop: "1px solid var(--border)", letterSpacing: "0.05em" }}>终场</div>
      )}
      {isLive && (
        <div style={{ fontSize: 8, fontWeight: 700, color: "var(--live)", textAlign: "center", padding: "2px 0 3px", borderTop: "1px solid rgba(255,61,61,0.2)", letterSpacing: "0.05em" }}>● 直播中</div>
      )}
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function KnockoutBracket({ fixtures = [] }) {
  const rounds = enrichRounds(fixtures);

  // 三四名决赛
  const tppBase = TPP[0];
  const tppFix  = fixtures.find(f => {
    const stage = (f.stage || f.round || "").toLowerCase();
    return ["third", "3rd place", "third place"].some(k => stage.includes(k));
  });
  const tppMatch = tppFix ? {
    ...tppBase,
    fixtureId: tppFix.id,
    status:    tppFix.status,
    homeScore: tppFix.homeScore ?? null,
    awayScore: tppFix.awayScore ?? null,
    homeTeam:  tppFix.home ? { name: tppFix.home.name, flag: tppFix.home.flag } : undefined,
    awayTeam:  tppFix.away ? { name: tppFix.away.name, flag: tppFix.away.flag } : undefined,
  } : tppBase;

  // 每列总宽度 = COL_W + CON_W（最后一列无连接线）
  const totalW = ROUNDS.length * COL_W + (ROUNDS.length - 1) * CON_W;

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", scrollbarWidth: "none", padding: "12px 12px 16px" }}>
      {/* 轮次标签行 */}
      <div style={{ display: "flex", width: totalW, marginBottom: 8 }}>
        {ROUNDS.map((round, ri) => (
          <div key={round.key} style={{ display: "flex", flexShrink: 0 }}>
            <div style={{
              width: COL_W,
              textAlign: "center",
              fontSize: 8, fontWeight: 800,
              color: round.key === "final" ? "var(--gold)" : "var(--blue)",
              textTransform: "uppercase", letterSpacing: "0.04em",
              height: LABEL_H, lineHeight: `${LABEL_H}px`,
            }}>
              {round.label}
            </div>
            {ri < ROUNDS.length - 1 && <div style={{ width: CON_W }} />}
          </div>
        ))}
      </div>

      {/* 对阵树主体 */}
      <div style={{ position: "relative", width: totalW, height: BRACKET_H }}>
        {rounds.map((round, ri) => {
          const colLeft = ri * (COL_W + CON_W);
          return (
            <div key={round.key}>
              {/* 比赛卡片列（绝对定位） */}
              <div style={{ position: "absolute", left: colLeft, top: 0, width: COL_W, height: BRACKET_H }}>
                {round.matches.map((match, mi) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    roundIndex={ri}
                    top={cardTop(ri, mi)}
                  />
                ))}
              </div>

              {/* 连接线（放在该列右侧） */}
              {ri < ROUNDS.length - 1 && (
                <div style={{ position: "absolute", left: colLeft + COL_W, top: 0, width: CON_W, height: BRACKET_H }}>
                  <Connectors roundIndex={ri} matchCount={round.matches.length} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 三四名决赛 */}
      <div style={{ marginTop: 16 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}>
          <span style={{
            fontSize: 8, fontWeight: 800, color: "var(--blue)",
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}>🥉 三四名决赛</span>
          <span style={{ fontSize: 8, color: "var(--text3)" }}>两支半决赛负者</span>
        </div>
        <ThirdPlaceCard match={tppMatch} />
      </div>

      {/* 注脚 */}
      <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 10, lineHeight: 1.6 }}>
        Q3a–h = 各组最佳第3名席位 · 对阵将在小组赛后由FIFA公布 · 点击卡片查看比赛详情
      </div>
    </div>
  );
}
