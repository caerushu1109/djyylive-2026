"use client";

/**
 * KnockoutBracket — 2026 FIFA World Cup 淘汰赛对阵树
 *
 * 横向可滚动，从左（32强）到右（决赛）。
 * 赛前显示 "1A / 2B" 资格标签；赛中/赛后显示真实球队。
 */

// ── 2026 WC 淘汰赛对阵模板 (赛前占位) ─────────────────────────────────────────
// 格式: { id, label, slots: [home, away] }
// 小组第1/2名: "1A", "2B" 等
// 小组第3最佳晋级: "Q3"（带角标说明选取规则）
// Winner of Mxx: "WM49" 等

const R32 = [
  { id: "M49",  home: "1A", away: "2B"  },
  { id: "M50",  home: "1C", away: "Q3a" },
  { id: "M51",  home: "1B", away: "Q3b" },
  { id: "M52",  home: "1D", away: "2A"  },
  { id: "M53",  home: "1E", away: "2F"  },
  { id: "M54",  home: "1G", away: "Q3c" },
  { id: "M55",  home: "1F", away: "Q3d" },
  { id: "M56",  home: "1H", away: "2E"  },
  { id: "M57",  home: "1I", away: "2J"  },
  { id: "M58",  home: "1K", away: "Q3e" },
  { id: "M59",  home: "1J", away: "Q3f" },
  { id: "M60",  home: "1L", away: "2I"  },
  { id: "M61",  home: "1G", away: "2H"  },  // placeholder — actual seeding TBD
  { id: "M62",  home: "2K", away: "Q3g" },
  { id: "M63",  home: "2L", away: "Q3h" },
  { id: "M64",  home: "1H", away: "2G"  },
];

const R16  = Array.from({ length: 8  }, (_, i) => ({ id: `R16-${i+1}`, home: `W${R32[i*2].id}`,   away: `W${R32[i*2+1].id}` }));
const QF   = Array.from({ length: 4  }, (_, i) => ({ id: `QF-${i+1}`,  home: `W${R16[i*2].id}`,  away: `W${R16[i*2+1].id}`  }));
const SF   = Array.from({ length: 2  }, (_, i) => ({ id: `SF-${i+1}`,  home: `W${QF[i*2].id}`,   away: `W${QF[i*2+1].id}`   }));
const FIN  = [{ id: "Final", home: `W${SF[0].id}`, away: `W${SF[1].id}` }];

const ROUNDS = [
  { key: "r32",   label: "32强",  matches: R32  },
  { key: "r16",   label: "16强",  matches: R16  },
  { key: "qf",    label: "四强赛", matches: QF   },
  { key: "sf",    label: "半决赛", matches: SF   },
  { key: "final", label: "决赛",  matches: FIN  },
];

// ── 样式常量 ─────────────────────────────────────────────────────────────────
const SLOT_H   = 44;   // px — 每支球队行高
const MATCH_H  = SLOT_H * 2 + 1; // px — 一场比赛（两队 + 分割线）
const COL_W    = 108;  // px — 每轮列宽
const GAP      = 8;    // px — connector 宽度

// ── 每轮基础间距（第0轮R32为0，之后每轮翻倍） ─────────────────────────────────
function roundGap(roundIndex) {
  // R32: 0, R16: MATCH_H+4, QF: 3*(MATCH_H+4), SF: 7*(MATCH_H+4)
  if (roundIndex === 0) return 0;
  return (Math.pow(2, roundIndex) - 1) * (MATCH_H + 4);
}

// ── 单个球队槽 ────────────────────────────────────────────────────────────────
function TeamSlot({ label, flag, name, isWinner }) {
  const hasTeam = !!name;
  return (
    <div style={{
      height: SLOT_H,
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "0 8px",
      background: isWinner ? "rgba(92,158,255,0.1)" : "transparent",
    }}>
      {hasTeam ? (
        <>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{flag || "🏳️"}</span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: isWinner ? "var(--blue)" : "var(--text)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: 60,
          }}>
            {name}
          </span>
        </>
      ) : (
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: "var(--text3)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {label || "待定"}
        </span>
      )}
    </div>
  );
}

// ── 单场比赛卡片 ──────────────────────────────────────────────────────────────
function MatchCard({ match, roundIndex }) {
  const isPlaceholder = !match.homeTeam && !match.awayTeam;
  const isFinal = roundIndex === 4;

  return (
    <div style={{
      width: COL_W,
      background: "var(--card)",
      border: `1px solid ${isFinal ? "rgba(255,193,7,0.4)" : "var(--border)"}`,
      borderRadius: 8,
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: isFinal ? "0 0 12px rgba(255,193,7,0.12)" : "none",
    }}>
      <TeamSlot
        label={match.home}
        flag={match.homeTeam?.flag}
        name={match.homeTeam?.name}
        isWinner={match.winner === "home"}
      />
      <div style={{ height: 1, background: "var(--border)", margin: "0 8px" }} />
      <TeamSlot
        label={match.away}
        flag={match.awayTeam?.flag}
        name={match.awayTeam?.name}
        isWinner={match.winner === "away"}
      />
      {/* Score badge — shown only when result available */}
      {(match.homeScore != null && match.awayScore != null) && (
        <div style={{
          position: "absolute", top: "50%", right: -20, transform: "translateY(-50%)",
          background: "var(--card2)", border: "1px solid var(--border2)",
          borderRadius: 4, padding: "1px 4px",
          fontSize: 10, fontWeight: 900,
          color: "var(--text)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {match.homeScore}–{match.awayScore}
        </div>
      )}
    </div>
  );
}

// ── 连接线（两场比赛 → 一场比赛） ────────────────────────────────────────────
function Connector({ topOffset, spacing }) {
  // topOffset: 上方那场比赛的中心y坐标
  // spacing: 两场比赛中心y的间距
  const midY = spacing / 2;
  return (
    <div style={{
      width: GAP,
      position: "relative",
      flexShrink: 0,
      alignSelf: "stretch",
    }}>
      {/* 上方竖线 */}
      <div style={{
        position: "absolute",
        left: 0, top: topOffset,
        width: 1,
        height: midY,
        background: "var(--border2)",
      }} />
      {/* 下方竖线 */}
      <div style={{
        position: "absolute",
        left: 0, top: topOffset + midY,
        width: 1,
        height: midY,
        background: "var(--border2)",
      }} />
      {/* 横线 → 连到右边 */}
      <div style={{
        position: "absolute",
        left: 0, top: topOffset + midY - 0.5,
        width: GAP,
        height: 1,
        background: "var(--border2)",
      }} />
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function KnockoutBracket({ fixtures = [] }) {
  // TODO: 赛时从 fixtures 中匹配已知结果填入 match.homeTeam / awayTeam / winner

  // 计算整体高度（以R32撑开为准）
  const totalH = R32.length * (MATCH_H + 4) - 4;

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "16px 12px",
        gap: 0,
        width: "max-content",
        minWidth: "100%",
        position: "relative",
      }}>
        {ROUNDS.map((round, roundIndex) => {
          const matchGap = roundGap(roundIndex);
          const topPad   = roundGap(roundIndex) / 2; // 首张卡片距顶部偏移，使中心对齐

          return (
            <div key={round.key} style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
              {/* 列 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {/* 轮次标签 */}
                <div style={{
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 800,
                  color: round.key === "final" ? "var(--gold)" : "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}>
                  {round.label}
                </div>

                {/* 卡片区 */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: matchGap + 4,
                  paddingTop: topPad,
                }}>
                  {round.matches.map((match, mi) => (
                    <div key={match.id} style={{ position: "relative" }}>
                      <MatchCard match={match} roundIndex={roundIndex} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 连接线（最后一列不需要） */}
              {roundIndex < ROUNDS.length - 1 && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingTop: topPad + 22 + 6, // 对齐卡片区（含标签高度）
                  gap: matchGap + 4,
                  flexShrink: 0,
                }}>
                  {round.matches.map((_, mi) => {
                    if (mi % 2 !== 0) return null; // 每两张卡出一条连接线
                    const nextMatchH = MATCH_H;
                    const pairSpan   = MATCH_H * 2 + matchGap + 4; // 两张卡+间距
                    return (
                      <div
                        key={mi}
                        style={{
                          width: GAP + 6,
                          height: pairSpan,
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        {/* 上竖线：从上方卡中心 → 中点 */}
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: MATCH_H / 2,
                          width: 1,
                          height: pairSpan / 2 - MATCH_H / 2,
                          background: "var(--border2)",
                        }} />
                        {/* 下竖线：从中点 → 下方卡中心 */}
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: pairSpan / 2,
                          width: 1,
                          height: pairSpan / 2 - MATCH_H / 2,
                          background: "var(--border2)",
                        }} />
                        {/* 横线 → 右 */}
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: pairSpan / 2,
                          width: GAP + 6,
                          height: 1,
                          background: "var(--border2)",
                        }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 注释 */}
      <div style={{
        padding: "0 12px 8px",
        fontSize: 9,
        color: "var(--text3)",
        lineHeight: 1.6,
      }}>
        Q3a–h = 各组最佳第3名晋级席位 · 对阵分组将在小组赛结束后公布
      </div>
    </div>
  );
}
