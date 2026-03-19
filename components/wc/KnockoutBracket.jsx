"use client";
import Link from "next/link";

/**
 * KnockoutBracket — 2026 FIFA World Cup 淘汰赛对阵树
 *
 * 方案B：经典5列竖向对阵树（FIFA / ESPN 移动端标准布局）
 *
 * 尺寸设计：
 *   CARD_W=60, CON_W=5 → 5列宽度 = 5×60 + 4×5 = 320px
 *   侧边半区标签列 = 14px
 *   左右外边距 = 12px×2 = 24px
 *   总计 = 358px < 375px → 手机无需横滑 ✓
 *
 * 连接线公式（已验证）：
 *   centerY(r, i) = UNIT × 2^r × (i + 0.5)
 *   每对卡片的中点 yM 精确等于下一轮对应卡的 centerY ✓
 */

// ── 2026 WC 淘汰赛对阵模板 ────────────────────────────────────────────────────
const R32 = [
  { id: "M49", home: "1A",  away: "2B"  },
  { id: "M50", home: "1C",  away: "Q3a" },
  { id: "M51", home: "1B",  away: "Q3b" },
  { id: "M52", home: "1D",  away: "2A"  },
  { id: "M53", home: "1E",  away: "2F"  },
  { id: "M54", home: "1G",  away: "Q3c" },
  { id: "M55", home: "1F",  away: "Q3d" },
  { id: "M56", home: "1H",  away: "2E"  },
  { id: "M57", home: "1I",  away: "2J"  },
  { id: "M58", home: "1K",  away: "Q3e" },
  { id: "M59", home: "1J",  away: "Q3f" },
  { id: "M60", home: "1L",  away: "2I"  },
  { id: "M61", home: "2G",  away: "2H"  },
  { id: "M62", home: "2K",  away: "Q3g" },
  { id: "M63", home: "2L",  away: "Q3h" },
  { id: "M64", home: "1K",  away: "2L"  },
];
const R16 = Array.from({ length: 8 }, (_, i) => ({ id: `R16-${i}`, home: `W${R32[i*2].id}`,  away: `W${R32[i*2+1].id}` }));
const QF  = Array.from({ length: 4 }, (_, i) => ({ id: `QF-${i}`,  home: `W${R16[i*2].id}`,  away: `W${R16[i*2+1].id}` }));
const SF  = Array.from({ length: 2 }, (_, i) => ({ id: `SF-${i}`,  home: `W${QF[i*2].id}`,   away: `W${QF[i*2+1].id}`  }));
const FIN = [{ id: "Final", home: `W${SF[0].id}`, away: `W${SF[1].id}` }];
const TPP = [{ id: "3rd",   home: `L${SF[0].id}`, away: `L${SF[1].id}` }];

const ROUNDS = [
  { r: 0, label: "32强", matches: R32 },
  { r: 1, label: "16强", matches: R16 },
  { r: 2, label: "八强", matches: QF  },
  { r: 3, label: "四强", matches: SF  },
  { r: 4, label: "决赛", matches: FIN },
];

// ── 布局常量（经验证适配 375px 屏幕） ─────────────────────────────────────────
const SLOT_H    = 20;                         // 每队行高
const CARD_H    = SLOT_H * 2 + 1;            // 41px（含1px分隔线）
const UNIT      = 60;                         // R32 场次插槽高度
const CARD_W    = 60;                         // 卡片宽度
const CON_W     = 5;                          // 连接线列宽
const N         = 16;                         // R32 场次数
const BRACKET_H = N * UNIT;                  // 960px
const TOTAL_W   = 5 * CARD_W + 4 * CON_W;   // 320px
const SIDE_W    = 14;                         // 半区标签侧栏宽

// 第 r 轮第 i 场的垂直中心
function cY(r, i) { return UNIT * Math.pow(2, r) * (i + 0.5); }
// 卡片顶部 Y
function cTop(r, i) { return cY(r, i) - CARD_H / 2; }
// 列左边距
function cX(r) { return r * (CARD_W + CON_W); }

// 决赛卡片边界（用于半区色条起止）
const FIN_TOP = cTop(4, 0);           // 459.5px
const FIN_BOT = FIN_TOP + CARD_H;    // 500.5px

// ── Fixture 数据映射 ──────────────────────────────────────────────────────────
function buildStageMap(fixtures) {
  const map = {};
  if (!fixtures?.length) return map;
  const KEYS = {
    r32: ["round of 32"], r16: ["round of 16"],
    qf:  ["quarter"],     sf:  ["semi"],
    fin: ["final"],       tpp: ["third", "3rd place", "third place"],
  };
  fixtures.forEach(f => {
    const stage = (f.stage || f.round || "").toLowerCase();
    for (const [key, kws] of Object.entries(KEYS)) {
      if (kws.some(k => stage.includes(k))) { (map[key] ??= []).push(f); break; }
    }
  });
  return map;
}

function enrich(match, list, idx) {
  const f = list?.[idx];
  if (!f) return match;
  return {
    ...match,
    fixtureId: f.id,     status:    f.status,
    homeScore: f.homeScore ?? null, awayScore: f.awayScore ?? null,
    homeTeam:  f.home ? { name: f.home.name, flag: f.home.flag } : undefined,
    awayTeam:  f.away ? { name: f.away.name, flag: f.away.flag } : undefined,
  };
}

// ── 球队行 ────────────────────────────────────────────────────────────────────
function TeamRow({ label, flag, name, score, isWinner, isLive }) {
  return (
    <div style={{
      height: SLOT_H, display: "flex", alignItems: "center", gap: 2,
      padding: "0 4px",
      background: isWinner ? "rgba(92,158,255,0.10)" : "transparent",
    }}>
      {name ? (
        <>
          <span style={{ fontSize: 10, flexShrink: 0, lineHeight: 1 }}>{flag || "🏳️"}</span>
          <span style={{
            fontSize: 7.5, fontWeight: 700, flex: 1,
            color: isWinner ? "var(--blue)" : "var(--text)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{name}</span>
          {score != null && (
            <span style={{
              fontSize: 9, fontWeight: 900, flexShrink: 0,
              color: isWinner ? "var(--blue)" : isLive ? "var(--live)" : "var(--text2)",
              fontVariantNumeric: "tabular-nums",
            }}>{score}</span>
          )}
        </>
      ) : (
        <span style={{ fontSize: 6.5, color: "var(--text3)" }}>{label || "待定"}</span>
      )}
    </div>
  );
}

// ── 比赛卡片 ──────────────────────────────────────────────────────────────────
function MatchCard({ match, isFinal = false }) {
  const isLive = match.status === "LIVE";
  const hasRes = match.homeScore != null && match.awayScore != null;
  const winner = hasRes
    ? match.homeScore > match.awayScore ? "home"
    : match.awayScore > match.homeScore ? "away" : null
    : null;

  const card = (
    <div style={{
      width: CARD_W,
      background: isFinal ? "linear-gradient(135deg,#1c1e26,#22201a)" : "var(--card)",
      border: `1px solid ${
        isFinal  ? "rgba(255,193,7,0.65)" :
        isLive   ? "rgba(255,61,61,0.4)"  : "var(--border)"
      }`,
      borderRadius: 6,
      overflow: "hidden",
      boxShadow: isFinal ? "0 0 14px rgba(255,193,7,0.18)" : "none",
    }}>
      {isFinal && <div style={{ height: 2, background: "linear-gradient(90deg,transparent,var(--gold),transparent)" }} />}
      {isLive  && <div style={{ height: 2, background: "var(--live)" }} />}
      <TeamRow label={match.home} flag={match.homeTeam?.flag} name={match.homeTeam?.name}
        score={match.homeScore} isWinner={winner === "home"} isLive={isLive} />
      <div style={{ height: 1, background: "var(--border)", margin: "0 5px" }} />
      <TeamRow label={match.away} flag={match.awayTeam?.flag} name={match.awayTeam?.name}
        score={match.awayScore} isWinner={winner === "away"} isLive={isLive} />
      {hasRes && !isLive && (
        <div style={{ fontSize: 6.5, fontWeight: 700, color: "var(--text3)",
          textAlign: "center", padding: "2px 0", borderTop: "1px solid var(--border)" }}>终场</div>
      )}
      {isLive && (
        <div style={{ fontSize: 6.5, fontWeight: 700, color: "var(--live)",
          textAlign: "center", padding: "2px 0", borderTop: "1px solid rgba(255,61,61,0.2)" }}>● 直播中</div>
      )}
    </div>
  );

  return match.fixtureId
    ? <Link href={`/match/${match.fixtureId}`} style={{ textDecoration: "none" }}>{card}</Link>
    : card;
}

// ── 连接线 SVG（每对相邻卡→下一列对应卡） ─────────────────────────────────────
function ConnectorSVG({ roundIndex, matchCount }) {
  const lines = [];
  for (let i = 0; i < matchCount; i += 2) {
    const y1  = cY(roundIndex, i);
    const y2  = cY(roundIndex, i + 1);
    const yM  = (y1 + y2) / 2;    // 精确等于 cY(roundIndex+1, i/2)
    lines.push(
      <line key={`v1-${i}`} x1={0} y1={y1} x2={0} y2={yM} />,
      <line key={`v2-${i}`} x1={0} y1={y2} x2={0} y2={yM} />,
      <line key={`h-${i}`}  x1={0} y1={yM} x2={CON_W} y2={yM} />,
    );
  }
  return (
    <svg
      width={CON_W} height={BRACKET_H}
      fill="none" stroke="var(--border2)" strokeWidth={1}
      style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
    >
      {lines}
    </svg>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function KnockoutBracket({ fixtures = [] }) {
  const sm = buildStageMap(fixtures);

  // 数据填充
  const enrichedRounds = ROUNDS.map((round) => {
    const stageKey = ["r32","r16","qf","sf","fin"][round.r];
    return {
      ...round,
      matches: round.matches.map((m, i) => enrich(m, sm[stageKey], i)),
    };
  });

  // 三四名决赛
  const tppFix = fixtures.find(f => {
    const s = (f.stage || f.round || "").toLowerCase();
    return ["third", "3rd place", "third place"].some(k => s.includes(k));
  });
  const tpp = tppFix ? {
    ...TPP[0],
    fixtureId: tppFix.id, status: tppFix.status,
    homeScore: tppFix.homeScore ?? null, awayScore: tppFix.awayScore ?? null,
    homeTeam: tppFix.home ? { name: tppFix.home.name, flag: tppFix.home.flag } : undefined,
    awayTeam: tppFix.away ? { name: tppFix.away.name, flag: tppFix.away.flag } : undefined,
  } : TPP[0];

  return (
    <div style={{ padding: "10px 12px 16px", overflowX: "hidden" }}>

      {/* ── 轮次标签行 ── */}
      <div style={{ display: "flex", marginLeft: SIDE_W, marginBottom: 4 }}>
        {ROUNDS.map((round, ri) => (
          <div key={round.r} style={{ display: "flex", flexShrink: 0 }}>
            <div style={{
              width: CARD_W, textAlign: "center",
              fontSize: 8, fontWeight: 800, letterSpacing: "0.06em",
              color: round.r === 4 ? "var(--gold)" : "var(--blue)",
              height: 18, lineHeight: "18px",
            }}>
              {round.label}
            </div>
            {ri < ROUNDS.length - 1 && <div style={{ width: CON_W }} />}
          </div>
        ))}
      </div>

      {/* ── 主体：侧边标签 + 对阵树 ── */}
      <div style={{ display: "flex" }}>

        {/* ─ 半区侧边指示条 ─ */}
        <div style={{
          width: SIDE_W, flexShrink: 0,
          position: "relative", height: BRACKET_H,
        }}>
          {/* 上半区蓝色条 */}
          <div style={{
            position: "absolute", left: 0, top: 0,
            width: 3, height: FIN_TOP,
            background: "linear-gradient(180deg, rgba(92,158,255,0.7), rgba(92,158,255,0.3))",
            borderRadius: "2px 2px 0 0",
          }} />
          {/* 上半区文字 */}
          <div style={{
            position: "absolute", left: 0,
            top: FIN_TOP / 2,
            transform: "translateY(-50%)",
            writingMode: "vertical-lr",
            fontSize: 7, fontWeight: 800, color: "#5c9eff",
            letterSpacing: "0.06em",
          }}>上半区</div>

          {/* 下半区金色条 */}
          <div style={{
            position: "absolute", left: 0, top: FIN_BOT,
            width: 3, height: BRACKET_H - FIN_BOT,
            background: "linear-gradient(180deg, rgba(255,193,7,0.3), rgba(255,193,7,0.7))",
            borderRadius: "0 0 2px 2px",
          }} />
          {/* 下半区文字 */}
          <div style={{
            position: "absolute", left: 0,
            top: FIN_BOT + (BRACKET_H - FIN_BOT) / 2,
            transform: "translateY(-50%)",
            writingMode: "vertical-lr",
            fontSize: 7, fontWeight: 800, color: "#ffc107",
            letterSpacing: "0.06em",
          }}>下半区</div>
        </div>

        {/* ─ 5列对阵树 ─ */}
        <div style={{
          position: "relative",
          width: TOTAL_W, height: BRACKET_H,
          flexShrink: 0,
        }}>

          {/* 决赛列背景光晕（仅覆盖最后一列区域，不影响连接线） */}
          <div style={{
            position: "absolute",
            top: FIN_TOP - 12,
            left: cX(4) - 4,
            width: CARD_W + 8,
            height: CARD_H + 24,
            background: "radial-gradient(ellipse at center, rgba(255,193,7,0.08) 0%, transparent 70%)",
            borderRadius: 12,
            pointerEvents: "none",
          }} />

          {/* 各列卡片 + 连接线 */}
          {enrichedRounds.map((round) => {
            const left = cX(round.r);
            return (
              <div key={round.r}>
                {/* 卡片列 */}
                {round.matches.map((match, i) => (
                  <div key={match.id} style={{
                    position: "absolute",
                    left, top: cTop(round.r, i),
                  }}>
                    <MatchCard match={match} isFinal={round.r === 4} />
                  </div>
                ))}

                {/* 连接线列（最后一列无连接线） */}
                {round.r < 4 && (
                  <div style={{
                    position: "absolute",
                    left: left + CARD_W, top: 0,
                    width: CON_W, height: BRACKET_H,
                  }}>
                    <ConnectorSVG roundIndex={round.r} matchCount={round.matches.length} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 三四名决赛 ── */}
      <div style={{
        marginTop: 16, marginLeft: SIDE_W,
        padding: "8px 10px",
        background: "rgba(92,158,255,0.04)",
        border: "1px solid rgba(92,158,255,0.18)",
        borderRadius: 8,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: "var(--blue)",
            letterSpacing: "0.04em", marginBottom: 3 }}>🥉 三四名决赛</div>
          <div style={{ fontSize: 7, color: "var(--text3)" }}>两支半决赛负队</div>
        </div>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <MatchCard match={tpp} />
      </div>

      {/* ── 注脚 ── */}
      <div style={{
        fontSize: 7.5, color: "var(--text3)",
        marginTop: 10, lineHeight: 1.6,
        textAlign: "center",
      }}>
        Q3a–h = 各组最佳第3名席位 · 对阵将在小组赛后由FIFA公布 · 点击卡片查看比赛详情
      </div>
    </div>
  );
}
