"use client";
import Link from "next/link";

/**
 * KnockoutBracket — 2026 FIFA World Cup 淘汰赛对阵树
 *
 * 布局：横向行式，每轮占一行，上下半区构成菱形。
 *
 *   上半区：R32(8) → R16(4) → QF(2) → SF(1)   【收敛型连接线】
 *            ───────── 🏆 决赛 ─────────
 *   下半区：SF(1)  → QF(2) → R16(4) → R32(8)   【展开型连接线】
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
const R16_T = Array.from({ length: 4 }, (_, i) => ({ id: `R16-T${i+1}`, home: `W${R32_T[i*2].id}`, away: `W${R32_T[i*2+1].id}` }));
const R16_B = Array.from({ length: 4 }, (_, i) => ({ id: `R16-B${i+1}`, home: `W${R32_B[i*2].id}`, away: `W${R32_B[i*2+1].id}` }));
const QF_T  = Array.from({ length: 2 }, (_, i) => ({ id: `QF-T${i+1}`,  home: `W${R16_T[i*2].id}`, away: `W${R16_T[i*2+1].id}` }));
const QF_B  = Array.from({ length: 2 }, (_, i) => ({ id: `QF-B${i+1}`,  home: `W${R16_B[i*2].id}`, away: `W${R16_B[i*2+1].id}` }));
const SF_T  = [{ id: "SF-T", home: `W${QF_T[0].id}`, away: `W${QF_T[1].id}` }];
const SF_B  = [{ id: "SF-B", home: `W${QF_B[0].id}`, away: `W${QF_B[1].id}` }];
const FIN   = [{ id: "Final", home: `W${SF_T[0].id}`, away: `W${SF_B[0].id}` }];
const TPP   = [{ id: "3rd",   home: `L${SF_T[0].id}`, away: `L${SF_B[0].id}` }];

// ── 尺寸常量 ──────────────────────────────────────────────────────────────────
const CARD_W  = 76;  // 卡片宽度
const CARD_H  = 52;  // 卡片高度（含分隔线）
const SLOT_H  = 24;  // 每队行高
const GAP     = 6;   // 卡片间距
const CON_H   = 16;  // 连接线区域高度
const SLOT_W  = CARD_W + GAP; // 86px

// 根据场次数计算行偏移（居中于 totalW）
function rowOffset(count, totalW) {
  const w = count * CARD_W + (count - 1) * GAP;
  return (totalW - w) / 2;
}

// ── fixture 数据填充 ───────────────────────────────────────────────────────────
function buildStageMap(fixtures) {
  const map = {};
  if (!fixtures?.length) return map;
  const keys = {
    r32:   ["round of 32"],
    r16:   ["round of 16"],
    qf:    ["quarter"],
    sf:    ["semi"],
    final: ["final"],
    tpp:   ["third", "3rd place", "third place"],
  };
  fixtures.forEach(f => {
    const stage = (f.stage || f.round || "").toLowerCase();
    for (const [key, kws] of Object.entries(keys)) {
      if (kws.some(k => stage.includes(k))) {
        (map[key] ??= []).push(f);
        break;
      }
    }
  });
  return map;
}

function enrich(match, list, idx) {
  const f = list?.[idx];
  if (!f) return match;
  return {
    ...match,
    fixtureId: f.id,
    status:    f.status,
    homeScore: f.homeScore ?? null,
    awayScore: f.awayScore ?? null,
    homeTeam:  f.home ? { name: f.home.name, flag: f.home.flag } : undefined,
    awayTeam:  f.away ? { name: f.away.name, flag: f.away.flag } : undefined,
  };
}

// ── 球队行 ────────────────────────────────────────────────────────────────────
function TeamRow({ label, flag, name, score, isWinner, isLive }) {
  return (
    <div style={{
      height: SLOT_H,
      display: "flex", alignItems: "center", gap: 3,
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
    : match.awayScore > match.homeScore ? "away"
    : null : null;

  const card = (
    <div style={{
      width: CARD_W, flexShrink: 0,
      background: isFinal ? "linear-gradient(135deg,#1c1e26,#22201a)" : "var(--card)",
      border: `1px solid ${isFinal ? "rgba(255,193,7,0.6)" : isLive ? "rgba(255,61,61,0.35)" : "var(--border)"}`,
      borderRadius: 8, overflow: "hidden",
      boxShadow: isFinal ? "0 0 18px rgba(255,193,7,0.18)" : "none",
    }}>
      {isFinal && <div style={{ height: 2, background: "linear-gradient(90deg,transparent,var(--gold),transparent)" }} />}
      {isLive  && <div style={{ height: 2, background: "var(--live)" }} />}
      <TeamRow label={match.home} flag={match.homeTeam?.flag} name={match.homeTeam?.name}
        score={match.homeScore} isWinner={winner==="home"} isLive={isLive} />
      <div style={{ height: 1, background: "var(--border)", margin: "0 6px" }} />
      <TeamRow label={match.away} flag={match.awayTeam?.flag} name={match.awayTeam?.name}
        score={match.awayScore} isWinner={winner==="away"} isLive={isLive} />
      {hasRes && !isLive && (
        <div style={{ fontSize: 7, fontWeight: 700, color: "var(--text3)", textAlign: "center",
          padding: "2px 0 3px", borderTop: "1px solid var(--border)" }}>终场</div>
      )}
      {isLive && (
        <div style={{ fontSize: 7, fontWeight: 700, color: "var(--live)", textAlign: "center",
          padding: "2px 0 3px", borderTop: "1px solid rgba(255,61,61,0.2)" }}>● 直播中</div>
      )}
    </div>
  );
  return match.fixtureId
    ? <Link href={`/match/${match.fixtureId}`} style={{ textDecoration: "none", flexShrink: 0 }}>{card}</Link>
    : card;
}

// ── 连接线 SVG ────────────────────────────────────────────────────────────────
// type="converge": fromCount=N, toCount=N/2  (上半区)
// type="diverge":  fromCount=N, toCount=2N   (下半区)
// fromOff / toOff: 各自行在 totalW 内的左偏移
function BracketConnector({ type, fromCount, toCount, fromOff, toOff, totalW }) {
  const lines = [];
  const h = CON_H;
  const pairs = type === "converge" ? toCount : fromCount;

  for (let k = 0; k < pairs; k++) {
    if (type === "converge") {
      // 两张 from 卡汇聚到一张 to 卡
      const xA = fromOff + (2*k)   * SLOT_W + CARD_W / 2;
      const xB = fromOff + (2*k+1) * SLOT_W + CARD_W / 2;
      const xM = toOff   +    k    * SLOT_W + CARD_W / 2;
      const yMid = h / 2;
      lines.push(
        <line key={`ca${k}`} x1={xA}  y1={0}    x2={xA}  y2={yMid} />,
        <line key={`cb${k}`} x1={xB}  y1={0}    x2={xB}  y2={yMid} />,
        <line key={`cc${k}`} x1={xA}  y1={yMid} x2={xB}  y2={yMid} />,
        <line key={`cd${k}`} x1={xM}  y1={yMid} x2={xM}  y2={h}    />,
      );
    } else {
      // 一张 from 卡展开到两张 to 卡
      const xF  = fromOff +    k    * SLOT_W + CARD_W / 2;
      const xA  = toOff   + (2*k)   * SLOT_W + CARD_W / 2;
      const xB  = toOff   + (2*k+1) * SLOT_W + CARD_W / 2;
      const yMid = h / 2;
      lines.push(
        <line key={`da${k}`} x1={xF}  y1={0}    x2={xF}  y2={yMid} />,
        <line key={`db${k}`} x1={xA}  y1={yMid} x2={xB}  y2={yMid} />,
        <line key={`dc${k}`} x1={xA}  y1={yMid} x2={xA}  y2={h}    />,
        <line key={`dd${k}`} x1={xB}  y1={yMid} x2={xB}  y2={h}    />,
      );
    }
  }

  return (
    <svg width={totalW} height={h}
      style={{ display: "block", flexShrink: 0 }}
      fill="none" stroke="var(--border2)" strokeWidth={1}>
      {lines}
    </svg>
  );
}

// ── 一行卡片（带标签） ────────────────────────────────────────────────────────
function RoundRow({ matches, label, labelColor, offset }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{
        paddingLeft: offset,
        fontSize: 8, fontWeight: 800,
        color: labelColor || "var(--blue)",
        letterSpacing: "0.06em",
        padding: "3px 0 3px",
        textAlign: "left",
        paddingLeft: offset + 2,
      }}>{label}</div>
      <div style={{
        display: "flex", flexDirection: "row", gap: GAP,
        paddingLeft: offset,
      }}>
        {matches.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function KnockoutBracket({ fixtures = [] }) {
  const sm = buildStageMap(fixtures);

  const r32t = R32_T.map((m, i) => enrich(m, sm.r32, i));
  const r32b = R32_B.map((m, i) => enrich(m, sm.r32, i + 8));
  const r16t = R16_T.map((m, i) => enrich(m, sm.r16, i));
  const r16b = R16_B.map((m, i) => enrich(m, sm.r16, i + 4));
  const qft  = QF_T.map((m, i)  => enrich(m, sm.qf,  i));
  const qfb  = QF_B.map((m, i)  => enrich(m, sm.qf,  i + 2));
  const sft  = SF_T.map((m, i)  => enrich(m, sm.sf,  i));
  const sfb  = SF_B.map((m, i)  => enrich(m, sm.sf,  i + 1));
  const fin  = FIN.map((m, i)   => enrich(m, sm.final, i));

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

  const totalW = 16 * CARD_W + 15 * GAP; // 1306px (need horizontal scroll)

  // 各轮在 totalW 内的左偏移
  const off32 = 0;                          // 8张 → 偏移0（已撑满）
  const off16 = rowOffset(4, totalW);       // 4张居中
  const offQF = rowOffset(2, totalW);       // 2张居中
  const offSF = rowOffset(1, totalW);       // 1张居中

  return (
    <div style={{ overflowX: "auto", scrollbarWidth: "none", padding: "12px 12px 16px" }}>
      <div style={{ width: totalW, display: "flex", flexDirection: "column" }}>

        {/* ── 上半区标签 ── */}
        <SectionLabel text="▲ 上半区" color="#5c9eff" bg="rgba(92,158,255,0.08)" border="rgba(92,158,255,0.25)" totalW={totalW} />

        {/* ── 上半区：R32 → R16 → QF → SF ── */}
        <RoundRow matches={r32t} label="32强" offset={off32} />
        <BracketConnector type="converge" fromCount={8} toCount={4} fromOff={off32} toOff={off16} totalW={totalW} />
        <RoundRow matches={r16t} label="16强" offset={off16} />
        <BracketConnector type="converge" fromCount={4} toCount={2} fromOff={off16} toOff={offQF} totalW={totalW} />
        <RoundRow matches={qft} label="八强" offset={offQF} />
        <BracketConnector type="converge" fromCount={2} toCount={1} fromOff={offQF} toOff={offSF} totalW={totalW} />
        <RoundRow matches={sft} label="四强" offset={offSF} />

        {/* ── 决赛 ── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "10px 0 8px",
          margin: "6px 0",
          borderTop: "1px solid rgba(255,193,7,0.2)",
          borderBottom: "1px solid rgba(255,193,7,0.2)",
          background: "linear-gradient(180deg,rgba(255,193,7,0.03),rgba(255,193,7,0.06),rgba(255,193,7,0.03))",
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--gold)",
            letterSpacing: "0.12em", marginBottom: 7 }}>🏆 决赛</span>
          <MatchCard match={fin[0]} isFinal />
        </div>

        {/* ── 下半区：SF → QF → R16 → R32 ── */}
        <RoundRow matches={sfb} label="四强" offset={offSF} />
        <BracketConnector type="diverge" fromCount={1} toCount={2} fromOff={offSF} toOff={offQF} totalW={totalW} />
        <RoundRow matches={qfb} label="八强" offset={offQF} />
        <BracketConnector type="diverge" fromCount={2} toCount={4} fromOff={offQF} toOff={off16} totalW={totalW} />
        <RoundRow matches={r16b} label="16强" offset={off16} />
        <BracketConnector type="diverge" fromCount={4} toCount={8} fromOff={off16} toOff={off32} totalW={totalW} />
        <RoundRow matches={r32b} label="32强" offset={off32} />

        {/* ── 下半区标签 ── */}
        <SectionLabel text="▼ 下半区" color="#ffc107" bg="rgba(255,193,7,0.08)" border="rgba(255,193,7,0.25)" totalW={totalW} />

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
              letterSpacing: "0.05em", marginBottom: 4 }}>🥉 三四名决赛</div>
            <div style={{ fontSize: 7, color: "var(--text3)" }}>两支半决赛负队</div>
          </div>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <MatchCard match={tpp} />
        </div>

        {/* ── 注脚 ── */}
        <div style={{ fontSize: 8, color: "var(--text3)", marginTop: 10, lineHeight: 1.6, textAlign: "center" }}>
          Q3a–h = 各组最佳第3名席位 · 对阵将在小组赛后由FIFA公布 · 点击卡片查看比赛详情
        </div>
      </div>
    </div>
  );
}

// ── 半区分隔标签 ──────────────────────────────────────────────────────────────
function SectionLabel({ text, color, bg, border, totalW }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${border})` }} />
      <span style={{
        fontSize: 9, fontWeight: 800, color,
        letterSpacing: "0.08em", whiteSpace: "nowrap",
        background: bg, border: `1px solid ${border}`,
        borderRadius: 4, padding: "2px 8px",
      }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${border},transparent)` }} />
    </div>
  );
}
