"use client";
import Link from "next/link";

/**
 * KnockoutBracket — 2026 FIFA World Cup 淘汰赛对阵树
 *
 * 布局：横向行式（每轮一行），上下半区构成菱形。
 *
 * 核心设计：slot-based 精确对齐
 *   每个 R32 场次占一个 SLOT_W 宽的插槽，所有后续轮次
 *   自动居中于对应 2^r 个插槽的中心，连接线精确对齐。
 *
 *   总宽 = 8 * SLOT_W（仅一个半区的宽度，上下半区垂直堆叠）
 *   这比旧版（16 * COL_W）窄一半，手机友好。
 *
 *   圆心 X 公式：cx(r, i) = (2^r * i + 2^(r-1)) * SLOT_W
 *     r=0 R32: 每场中心在 (i + 0.5) * SLOT_W
 *     r=1 R16: 每场中心在 (2i + 1) * SLOT_W
 *     r=2 QF:  每场中心在 (4i + 2) * SLOT_W
 *     r=3 SF:  每场中心在  4       * SLOT_W  (正好是总宽一半)
 */

// ── 2026 WC 淘汰赛模板 ────────────────────────────────────────────────────────
const R32_ALL = [
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
const R32_T = R32_ALL.slice(0, 8);
const R32_B = R32_ALL.slice(8);
const R16_T = Array.from({ length: 4 }, (_, i) => ({ id: `R16T${i}`, home: `W${R32_T[i*2].id}`, away: `W${R32_T[i*2+1].id}` }));
const R16_B = Array.from({ length: 4 }, (_, i) => ({ id: `R16B${i}`, home: `W${R32_B[i*2].id}`, away: `W${R32_B[i*2+1].id}` }));
const QF_T  = Array.from({ length: 2 }, (_, i) => ({ id: `QFT${i}`,  home: `W${R16_T[i*2].id}`, away: `W${R16_T[i*2+1].id}` }));
const QF_B  = Array.from({ length: 2 }, (_, i) => ({ id: `QFB${i}`,  home: `W${R16_B[i*2].id}`, away: `W${R16_B[i*2+1].id}` }));
const SF_T  = [{ id: "SFT", home: `W${QF_T[0].id}`, away: `W${QF_T[1].id}` }];
const SF_B  = [{ id: "SFB", home: `W${QF_B[0].id}`, away: `W${QF_B[1].id}` }];
const FIN   = [{ id: "Final", home: `W${SF_T[0].id}`, away: `W${SF_B[0].id}` }];
const TPP   = [{ id: "3rd",   home: `L${SF_T[0].id}`, away: `L${SF_B[0].id}` }];

// ── 布局常量 ──────────────────────────────────────────────────────────────────
const SLOT_W = 76;           // 每个 R32 场次的插槽宽度
const HALF_W = 8 * SLOT_W;  // = 608px（上下半区共享此宽度）
const CARD_W = 66;           // 卡片宽度（每侧留 5px 边距）
const SLOT_H = 23;           // 每队行高
const CARD_H = SLOT_H * 2 + 1; // = 47px（含分隔线）
const CON_H  = 14;           // 连接线区域高度
const LBL_H  = 15;           // 轮次标签高度

// 第 r 轮（0=R32…3=SF）第 i 场的中心 X
function cx(r, i) {
  return (Math.pow(2, r) * i + Math.pow(2, r - 1)) * SLOT_W;
}
// 卡片左边距
function cl(r, i) {
  return cx(r, i) - CARD_W / 2;
}

// ── fixture 数据填充 ──────────────────────────────────────────────────────────
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
    ...match, fixtureId: f.id, status: f.status,
    homeScore: f.homeScore ?? null, awayScore: f.awayScore ?? null,
    homeTeam: f.home ? { name: f.home.name, flag: f.home.flag } : undefined,
    awayTeam: f.away ? { name: f.away.name, flag: f.away.flag } : undefined,
  };
}

// ── 球队行 ────────────────────────────────────────────────────────────────────
function TeamRow({ label, flag, name, score, isWinner, isLive }) {
  return (
    <div style={{
      height: SLOT_H, display: "flex", alignItems: "center", gap: 3,
      padding: "0 5px",
      background: isWinner ? "rgba(92,158,255,0.10)" : "transparent",
    }}>
      {name ? (
        <>
          <span style={{ fontSize: 11, flexShrink: 0 }}>{flag || "🏳️"}</span>
          <span style={{
            fontSize: 8, fontWeight: 700, flex: 1,
            color: isWinner ? "var(--blue)" : "var(--text)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
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
        <span style={{ fontSize: 7, color: "var(--text3)" }}>{label || "待定"}</span>
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
      border: `1px solid ${isFinal ? "rgba(255,193,7,0.6)" : isLive ? "rgba(255,61,61,0.4)" : "var(--border)"}`,
      borderRadius: 7, overflow: "hidden",
      boxShadow: isFinal ? "0 0 20px rgba(255,193,7,0.2)" : "none",
    }}>
      {isFinal && <div style={{ height: 2, background: "linear-gradient(90deg,transparent,var(--gold),transparent)" }} />}
      {isLive  && <div style={{ height: 2, background: "var(--live)" }} />}
      <TeamRow label={match.home} flag={match.homeTeam?.flag} name={match.homeTeam?.name}
        score={match.homeScore} isWinner={winner === "home"} isLive={isLive} />
      <div style={{ height: 1, background: "var(--border)", margin: "0 6px" }} />
      <TeamRow label={match.away} flag={match.awayTeam?.flag} name={match.awayTeam?.name}
        score={match.awayScore} isWinner={winner === "away"} isLive={isLive} />
      {hasRes && !isLive && (
        <div style={{ fontSize: 7, fontWeight: 700, color: "var(--text3)",
          textAlign: "center", padding: "2px 0 2px", borderTop: "1px solid var(--border)" }}>终场</div>
      )}
      {isLive && (
        <div style={{ fontSize: 7, fontWeight: 700, color: "var(--live)",
          textAlign: "center", padding: "2px 0 2px", borderTop: "1px solid rgba(255,61,61,0.2)" }}>● 直播中</div>
      )}
    </div>
  );

  return match.fixtureId
    ? <Link href={`/match/${match.fixtureId}`} style={{ textDecoration: "none" }}>{card}</Link>
    : card;
}

// ── 轮次标签行 ────────────────────────────────────────────────────────────────
function RoundLabel({ label, color }) {
  return (
    <div style={{
      height: LBL_H, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, fontWeight: 800, letterSpacing: "0.07em",
      color: color || "var(--blue)",
    }}>{label}</div>
  );
}

// ── 卡片行（absolute 定位，精确对齐） ─────────────────────────────────────────
function MatchRow({ matches, roundIdx }) {
  return (
    <div style={{ position: "relative", width: HALF_W, height: CARD_H, flexShrink: 0 }}>
      {matches.map((m, i) => (
        <div key={m.id} style={{ position: "absolute", top: 0, left: cl(roundIdx, i) }}>
          <MatchCard match={m} />
        </div>
      ))}
    </div>
  );
}

// ── 收敛连接线（上半区：从 fromR 向下汇聚到 fromR+1） ─────────────────────────
function ConvergeSVG({ fromR, count }) {
  const lines = [];
  const yMid = CON_H / 2;
  const pairs = count / 2;
  for (let k = 0; k < pairs; k++) {
    const x1 = cx(fromR,   2*k);
    const x2 = cx(fromR,   2*k + 1);
    const xM = cx(fromR+1, k);          // 精确等于 (x1+x2)/2
    lines.push(
      <line key={`a${k}`} x1={x1} y1={0}    x2={x1} y2={yMid} />,
      <line key={`b${k}`} x1={x2} y1={0}    x2={x2} y2={yMid} />,
      <line key={`c${k}`} x1={x1} y1={yMid} x2={x2} y2={yMid} />,
      <line key={`d${k}`} x1={xM} y1={yMid} x2={xM} y2={CON_H} />,
    );
  }
  return <BracketSVG>{lines}</BracketSVG>;
}

// ── 展开连接线（下半区：从 fromR 向下展开到 fromR-1） ─────────────────────────
function DivergeSVG({ fromR, count }) {
  const lines = [];
  const yMid = CON_H / 2;
  for (let k = 0; k < count; k++) {
    const xF  = cx(fromR,   k);
    const xT0 = cx(fromR-1, 2*k);
    const xT1 = cx(fromR-1, 2*k + 1);  // xF 精确等于 (xT0+xT1)/2
    lines.push(
      <line key={`a${k}`} x1={xF}  y1={0}    x2={xF}  y2={yMid} />,
      <line key={`b${k}`} x1={xT0} y1={yMid} x2={xT1} y2={yMid} />,
      <line key={`c${k}`} x1={xT0} y1={yMid} x2={xT0} y2={CON_H} />,
      <line key={`d${k}`} x1={xT1} y1={yMid} x2={xT1} y2={CON_H} />,
    );
  }
  return <BracketSVG>{lines}</BracketSVG>;
}

// ── SF → 决赛 → SF 垂直连接线（居中） ─────────────────────────────────────────
function FinalLineSVG({ color }) {
  const xC = HALF_W / 2;  // = 4 * SLOT_W = cx(3, 0) ✓ 三者完全对齐
  return (
    <svg width={HALF_W} height={CON_H} fill="none" style={{ display: "block", flexShrink: 0 }}>
      <line x1={xC} y1={0} x2={xC} y2={CON_H} stroke={color || "var(--border2)"} strokeWidth={1} />
    </svg>
  );
}

function BracketSVG({ children }) {
  return (
    <svg width={HALF_W} height={CON_H} fill="none"
      stroke="var(--border2)" strokeWidth={1}
      style={{ display: "block", flexShrink: 0 }}>
      {children}
    </svg>
  );
}

// ── 半区标题 ──────────────────────────────────────────────────────────────────
function HalfLabel({ text, color, bg, border }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0" }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${border})` }} />
      <span style={{
        fontSize: 9, fontWeight: 800, color,
        letterSpacing: "0.08em",
        background: bg, border: `1px solid ${border}`,
        borderRadius: 4, padding: "2px 8px",
      }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${border},transparent)` }} />
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function KnockoutBracket({ fixtures = [] }) {
  const sm = buildStageMap(fixtures);

  // 数据填充
  const r32t = R32_T.map((m, i) => enrich(m, sm.r32, i));
  const r32b = R32_B.map((m, i) => enrich(m, sm.r32, i + 8));
  const r16t = R16_T.map((m, i) => enrich(m, sm.r16, i));
  const r16b = R16_B.map((m, i) => enrich(m, sm.r16, i + 4));
  const qft  = QF_T.map((m, i)  => enrich(m, sm.qf,  i));
  const qfb  = QF_B.map((m, i)  => enrich(m, sm.qf,  i + 2));
  const sft  = SF_T.map((m, i)  => enrich(m, sm.sf,  i));
  const sfb  = SF_B.map((m, i)  => enrich(m, sm.sf,  i + 1));
  const fin  = FIN.map((m, i)   => enrich(m, sm.fin, i));

  const tppFix = fixtures.find(f => {
    const s = (f.stage || f.round || "").toLowerCase();
    return ["third", "3rd place", "third place"].some(k => s.includes(k));
  });
  const tpp = tppFix ? {
    ...TPP[0], fixtureId: tppFix.id, status: tppFix.status,
    homeScore: tppFix.homeScore ?? null, awayScore: tppFix.awayScore ?? null,
    homeTeam: tppFix.home ? { name: tppFix.home.name, flag: tppFix.home.flag } : undefined,
    awayTeam: tppFix.away ? { name: tppFix.away.name, flag: tppFix.away.flag } : undefined,
  } : TPP[0];

  return (
    <div style={{
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      padding: "12px 12px 16px",
    }}>
      {/* 内容容器：宽度固定为 HALF_W，垂直 flex 排列 */}
      <div style={{
        width: HALF_W,
        display: "flex",
        flexDirection: "column",
        margin: "0 auto",
      }}>

        {/* ── 上半区标签 ── */}
        <HalfLabel
          text="▲ 上半区"
          color="#5c9eff"
          bg="rgba(92,158,255,0.08)"
          border="rgba(92,158,255,0.28)"
        />

        {/* ── 上半区：R32 → R16 → QF → SF ── */}
        <RoundLabel label="32 强" />
        <MatchRow matches={r32t} roundIdx={0} />
        <ConvergeSVG fromR={0} count={8} />

        <RoundLabel label="16 强" />
        <MatchRow matches={r16t} roundIdx={1} />
        <ConvergeSVG fromR={1} count={4} />

        <RoundLabel label="八 强" />
        <MatchRow matches={qft} roundIdx={2} />
        <ConvergeSVG fromR={2} count={2} />

        <RoundLabel label="四 强" />
        <MatchRow matches={sft} roundIdx={3} />

        {/* ── SF → 决赛连线 ── */}
        <FinalLineSVG color="rgba(255,193,7,0.5)" />

        {/* ── 决赛 ── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "6px 0 5px",
          background: "linear-gradient(180deg,rgba(255,193,7,0.04),rgba(255,193,7,0.08),rgba(255,193,7,0.04))",
          borderTop: "1px solid rgba(255,193,7,0.2)",
          borderBottom: "1px solid rgba(255,193,7,0.2)",
        }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: "var(--gold)",
            letterSpacing: "0.12em", marginBottom: 6,
          }}>🏆 决 赛</span>
          <MatchCard match={fin[0]} isFinal />
        </div>

        {/* ── 决赛 → SF 连线 ── */}
        <FinalLineSVG color="rgba(255,193,7,0.5)" />

        {/* ── 下半区：SF → QF → R16 → R32 ── */}
        <RoundLabel label="四 强" />
        <MatchRow matches={sfb} roundIdx={3} />
        <DivergeSVG fromR={3} count={1} />

        <RoundLabel label="八 强" />
        <MatchRow matches={qfb} roundIdx={2} />
        <DivergeSVG fromR={2} count={2} />

        <RoundLabel label="16 强" />
        <MatchRow matches={r16b} roundIdx={1} />
        <DivergeSVG fromR={1} count={4} />

        <RoundLabel label="32 强" />
        <MatchRow matches={r32b} roundIdx={0} />

        {/* ── 下半区标签 ── */}
        <HalfLabel
          text="▼ 下半区"
          color="#ffc107"
          bg="rgba(255,193,7,0.08)"
          border="rgba(255,193,7,0.28)"
        />

        {/* ── 三四名决赛 ── */}
        <div style={{
          marginTop: 14, padding: "8px 10px",
          background: "rgba(92,158,255,0.04)",
          border: "1px solid rgba(92,158,255,0.15)",
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
          fontSize: 8, color: "var(--text3)",
          marginTop: 10, lineHeight: 1.6, textAlign: "center",
        }}>
          Q3a–h = 各组最佳第3名席位 · 对阵将在小组赛后由FIFA公布
        </div>
      </div>
    </div>
  );
}
