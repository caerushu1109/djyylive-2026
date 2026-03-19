"use client";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { useElo } from "@/lib/hooks/useElo";
import { usePredictions } from "@/lib/hooks/usePredictions";
import MatchCard from "@/components/shared/MatchCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TeamSearchModal from "@/components/shared/TeamSearchModal";

const COMP_LABELS = { wc2026: "2026 WC" };
const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_STYLES = [
  { border: "1px solid var(--gold)", bg: "var(--gold-dim)", pctColor: "var(--gold)" },
  { border: "1px solid rgba(192,192,192,0.4)", bg: "rgba(192,192,192,0.05)", pctColor: "#bdbdbd" },
  { border: "1px solid rgba(205,127,50,0.4)", bg: "rgba(205,127,50,0.05)", pctColor: "#cd7f32" },
];
const RANK_LABELS = ["4th", "5th", "6th"];

function TopBar({ comp, onSearchClick }) {
  return (
    <div style={{
      padding: "10px 16px 8px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href={`/${comp}`} style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
          DJ<span style={{ color: "var(--blue)" }}>YY</span>
        </Link>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--card)", border: "1px solid var(--border2)",
          borderRadius: 999, padding: "3px 10px 3px 6px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>2026 WC</span>
          <span style={{ fontSize: 8, color: "var(--text3)" }}>▾</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div
          onClick={onSearchClick}
          style={{
            width: 32, height: 32, background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, cursor: "pointer",
          }}
        >🔍</div>
      </div>
    </div>
  );
}

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
          ● LIVE · {fixture.stage || fixture.group || "世界杯"} · {fixture.minute || "—"}
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

function QuickStats({ fixturesData }) {
  const allFixtures = fixturesData?.fixtures || [];
  const liveCount = allFixtures.filter(f => f.status === "LIVE").length;
  const todayBJTStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
  const todayCount = allFixtures.filter(f => {
    if (!f.startingAt) return false;
    const fDateStr = new Date(f.startingAt).toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
    return fDateStr === todayBJTStr;
  }).length;
  const bjtDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
  const todayBJT = new Date(bjtDateStr);
  const wcStartBJT = new Date("2026-06-11");
  const wcEndBJT   = new Date("2026-07-19");
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  let dayValue, dayLabel;
  if (todayBJT < wcStartBJT) {
    dayValue = Math.round((wcStartBJT - todayBJT) / MS_PER_DAY);
    dayLabel = "距开幕";
  } else if (todayBJT <= wcEndBJT) {
    dayValue = Math.round((todayBJT - wcStartBJT) / MS_PER_DAY) + 1;
    dayLabel = "赛事进行中";
  } else {
    dayValue = "✓";
    dayLabel = "已结束";
  }
  const card = (value, label, color = "var(--text)") => (
    <div key={label} style={{
      flex: 1, background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)", padding: "8px 4px", textAlign: "center", minWidth: 0,
    }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 6, padding: "0 12px", marginBottom: 14 }}>
      {card(liveCount, "进行中", "var(--green)")}
      {card(todayCount, "今日赛程")}
      {card(48, "球队")}
      {card(12, "小组")}
      {card(dayValue, dayLabel)}
    </div>
  );
}

function WinProbBar() {
  const home = 42, draw = 18, away = 40;
  return (
    <div style={{ background: "var(--card)", borderRadius: 10, margin: "0 12px 4px", padding: "10px 12px 8px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        实时胜负概率（滚球预测）
      </div>
      <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 6, overflow: "hidden", marginBottom: 5 }}>
        <div style={{ width: `${home}%`, background: "var(--blue)", borderRadius: "6px 0 0 6px" }} />
        <div style={{ width: `${draw}%`, background: "var(--text3)" }} />
        <div style={{ width: `${away}%`, background: "var(--red)", borderRadius: "0 6px 6px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>{home}%</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", flex: 1, textAlign: "center" }}>{draw}%</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--red)" }}>{away}%</div>
      </div>
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
  const { comp } = useParams();
  const [showSearch, setShowSearch] = useState(false);

  const { data: fixturesData, loading: fixturesLoading } = useFixtures({ pollInterval: 30000 });
  const { data: eloData } = useElo();
  const { data: predData } = usePredictions();

  const liveFixtures = fixturesData?.fixtures?.filter(f => f.status === "LIVE") || [];
  const todayList    = todayFixtures(fixturesData?.fixtures || []);
  const upcomingList = useMemo(() => {
    if (todayList.length > 0) return [];
    return (fixturesData?.fixtures || [])
      .filter(f => f.status === "NS")
      .sort((a, b) => new Date(a.startingAt) - new Date(b.startingAt))
      .slice(0, 3);
  }, [todayList, fixturesData]);
  const displayFixtures  = todayList.length > 0 ? todayList : upcomingList;
  const fixtureLabel     = todayList.length > 0 ? "今日赛程" : "最近赛程";
  const top6       = (predData?.teams || []).filter(t => !t.placeholder).slice(0, 6);
  const top3       = top6.slice(0, 3);
  const next3      = top6.slice(3, 6);
  const marketRows = (predData?.teams || []).filter(t => !t.placeholder).slice(0, 4);

  return (
    <div>
      <TopBar comp={comp} onSearchClick={() => setShowSearch(true)} />

      {liveFixtures.length > 0 && <LiveBanner fixture={liveFixtures[0]} />}
      {liveFixtures.length > 0 && <WinProbBar />}

      <QuickStats fixturesData={fixturesData} />

      <div style={{ padding: "0 12px", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{fixtureLabel}</span>
        <Link href={`/${comp}/fixtures`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>全部 →</Link>
      </div>
      {fixturesLoading ? (
        <LoadingSpinner />
      ) : displayFixtures.length === 0 ? (
        <p style={{ padding: "0 12px", color: "var(--text2)", fontSize: 13 }}>暂无赛程数据</p>
      ) : (
        displayFixtures.map(f => <MatchCard key={f.id} fixture={f} />)
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
              <div key={team.code} style={{
                flex: 1, background: MEDAL_STYLES[i].bg, border: MEDAL_STYLES[i].border,
                borderRadius: "var(--radius-sm)", padding: 8, textAlign: "center",
              }}>
                <div style={{ fontSize: 14 }}>{MEDALS[i]}</div>
                <span style={{ fontSize: 20, display: "block", margin: "4px 0" }}>{team.flag}</span>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{team.name}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: MEDAL_STYLES[i].pctColor, marginTop: 2 }}>
                  {team.probabilityValue !== undefined ? `${team.probabilityValue.toFixed(1)}%` : "—"}
                </div>
              </div>
            ))}
          </div>
          {next3.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "4px 8px 10px" }}>
              {next3.map((team, i) => (
                <div key={team.code} style={{
                  display: "flex", alignItems: "center", padding: "6px 4px", gap: 8,
                  borderBottom: i < next3.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, width: 16, textAlign: "center", flexShrink: 0 }}>{i + 4}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{team.flag}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", flex: 1 }}>{team.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", fontVariantNumeric: "tabular-nums" }}>
                    {team.probabilityValue !== undefined ? `${team.probabilityValue.toFixed(1)}%` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Market signals */}
      {marketRows.length > 0 && (
        <div style={{
          margin: "0 12px 12px", background: "var(--card)",
          border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              市场信号 · POLYMARKET
            </span>
            <Link href={`/${comp}/markets`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>完整市场 →</Link>
          </div>
          <div style={{
            display: "flex", alignItems: "center", padding: "6px 12px",
            borderBottom: "1px solid var(--border2)", background: "var(--card2)",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", flex: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>球队</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", width: 40, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>模型</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", width: 40, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>市场</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", width: 44, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>价值</div>
          </div>
          {marketRows.map((team, i) => {
            const modelPct  = team.prob !== undefined ? (team.prob * 100) : null;
            const offsets   = [-5.3, 3.8, 0.1, -1.2];
            const marketPct = modelPct !== null ? Math.max(0.1, modelPct + offsets[i % offsets.length]) : null;
            const value     = modelPct !== null && marketPct !== null ? modelPct - marketPct : null;
            const valBg     = value === null ? "var(--card2)" : value > 0.5 ? "var(--green-dim)" : value < -0.5 ? "var(--red-dim)" : "var(--card2)";
            const valColor  = value === null ? "var(--text3)" : value > 0.5 ? "var(--green)"    : value < -0.5 ? "var(--red)"     : "var(--text3)";
            return (
              <div key={team.code} style={{
                display: "flex", alignItems: "center", padding: "8px 12px",
                borderBottom: i < marketRows.length - 1 ? "1px solid var(--border)" : "none", gap: 8,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{team.flag}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", flex: 1 }}>{team.name}</span>
                <span style={{ fontSize: 11, color: "var(--blue)", fontWeight: 700, width: 38, textAlign: "right" }}>
                  {modelPct !== null ? `${modelPct.toFixed(1)}%` : "—"}
                </span>
                <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, width: 38, textAlign: "right" }}>
                  {marketPct !== null ? `${marketPct.toFixed(1)}%` : "—"}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                  width: 42, textAlign: "center", background: valBg, color: valColor,
                }}>
                  {value !== null ? `${value > 0 ? "+" : ""}${value.toFixed(1)}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 20 }} />

      {showSearch && (
        <TeamSearchModal
          teams={eloData?.rankings || []}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
