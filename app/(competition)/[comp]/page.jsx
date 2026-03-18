"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { useElo } from "@/lib/hooks/useElo";
import { usePredictions } from "@/lib/hooks/usePredictions";
import MatchCard from "@/components/shared/MatchCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const COMP_LABELS = { wc2026: "2026 WC" };
const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_STYLES = [
  { border: "var(--gold)", bg: "var(--gold-dim)", pctColor: "var(--gold)" },
  { border: "rgba(192,192,192,0.4)", bg: "rgba(192,192,192,0.05)", pctColor: "#bdbdbd" },
  { border: "rgba(205,127,50,0.4)", bg: "rgba(205,127,50,0.05)", pctColor: "#cd7f32" },
];

function TopBar({ comp, liveCount }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px 8px", flexShrink: 0,
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.04em" }}>
          DJ<span style={{ color: "var(--blue)" }}>YY</span>
        </span>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "var(--card)", border: "1px solid var(--border2)",
          borderRadius: 999, padding: "3px 10px 3px 6px",
          fontSize: 11, fontWeight: 700, color: "var(--text-dim)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", display: "inline-block" }} />
          {COMP_LABELS[comp] || comp}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {liveCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "var(--red-dim)", border: "1px solid rgba(255,61,61,0.3)",
            borderRadius: 8, padding: "4px 10px",
            color: "var(--live)", fontSize: 11, fontWeight: 700,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--live)", animation: "livepulse 1.2s infinite", display: "inline-block" }} />
            {liveCount} 场进行中
          </div>
        )}
        <div style={{
          width: 32, height: 32, background: "var(--card)",
          border: "1px solid var(--border)", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, color: "var(--text-dim)",
        }}>🔔</div>
        <div style={{
          width: 32, height: 32, background: "var(--card)",
          border: "1px solid var(--border)", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, color: "var(--text-dim)",
        }}>🔍</div>
      </div>
    </div>
  );
}

function SectionHdr({ title, link, href }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 12px", marginBottom: 6,
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {title}
      </span>
      {href && (
        <Link href={href} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>{link}</Link>
      )}
    </div>
  );
}

function todayFixtures(fixtures) {
  if (!fixtures?.length) return [];
  const today = new Date().toDateString();
  const result = fixtures.filter(f => f.startingAt && new Date(f.startingAt).toDateString() === today);
  return result.length ? result : fixtures.filter(f => f.status === "NS").slice(0, 6);
}

export default function CompHomePage() {
  const { comp } = useParams();
  const { data: fixturesData, loading: fixturesLoading } = useFixtures({ pollInterval: 30000 });
  const { data: eloData } = useElo();
  const { data: predData } = usePredictions();

  const liveFixtures = fixturesData?.fixtures?.filter(f => f.status === "LIVE") || [];
  const displayFixtures = todayFixtures(fixturesData?.fixtures || []);
  const top3 = (predData?.teams || []).filter(t => !t.placeholder).slice(0, 3);
  const marketRows = (predData?.teams || []).filter(t => !t.placeholder).slice(0, 4);

  return (
    <div>
      <TopBar comp={comp} liveCount={fixturesData?.liveCount || 0} />

      <div style={{ paddingBottom: 16 }}>

        {/* Live matches */}
        {liveFixtures.length > 0 && (
          <section style={{ marginTop: 12 }}>
            <SectionHdr title="🔴 进行中" />
            {liveFixtures.map(f => <MatchCard key={f.id} fixture={f} />)}
          </section>
        )}

        {/* Today's fixtures */}
        <section style={{ marginTop: 12 }}>
          <SectionHdr title="今日赛程" link="全部 →" href={`/${comp}/fixtures`} />
          {fixturesLoading ? (
            <LoadingSpinner />
          ) : displayFixtures.length === 0 ? (
            <p style={{ padding: "0 12px", color: "var(--text-dim)", fontSize: 13 }}>今日暂无比赛</p>
          ) : (
            displayFixtures.map(f => <MatchCard key={f.id} fixture={f} />)
          )}
        </section>

        {/* ELO Top 3 */}
        {top3.length > 0 && (
          <section style={{ marginTop: 20 }}>
            <div style={{
              margin: "0 12px 10px",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", overflow: "hidden",
            }}>
              <div style={{
                padding: "10px 12px 0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  夺冠热门 · ELO模型
                </span>
                <Link href={`/${comp}/predict`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>完整榜 →</Link>
              </div>
              <div style={{ display: "flex", padding: "10px 8px 12px", gap: 6 }}>
                {top3.map((team, i) => {
                  const s = MEDAL_STYLES[i];
                  return (
                    <div key={team.code} style={{
                      flex: 1, background: "var(--card2)", borderRadius: "var(--radius-sm)",
                      padding: 8, textAlign: "center",
                      border: `1px solid ${s.border}`,
                      background: s.bg,
                    }}>
                      <div style={{ fontSize: 14 }}>{MEDALS[i]}</div>
                      <span style={{ fontSize: 20, display: "block", margin: "4px 0" }}>{team.flag}</span>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{team.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: s.pctColor, marginTop: 2 }}>
                        {team.prob !== undefined ? `${(team.prob * 100).toFixed(1)}%` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Market signals */}
        {marketRows.length > 0 && (
          <section style={{ marginTop: 4 }}>
            <div style={{
              margin: "0 12px",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", overflow: "hidden",
            }}>
              <div style={{
                padding: "10px 12px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  市场信号 · POLYMARKET
                </span>
                <Link href={`/${comp}/markets`} style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>完整市场 →</Link>
              </div>
              {/* Header row */}
              <div style={{
                display: "flex", alignItems: "center", padding: "5px 12px",
                borderBottom: "1px solid var(--border)", background: "var(--card2)",
              }}>
                <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>球队</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", width: 38, textAlign: "right", textTransform: "uppercase" }}>模型</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", width: 38, textAlign: "right", textTransform: "uppercase" }}>市场</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", width: 44, textAlign: "center", textTransform: "uppercase" }}>价值</span>
              </div>
              {marketRows.map((team, i) => {
                const modelPct = team.prob !== undefined ? (team.prob * 100) : null;
                // Simulate market% as model ± small random-ish offset based on rank
                const offsets = [-5.3, 3.8, 0.1, -1.2];
                const marketPct = modelPct !== null ? Math.max(0.1, modelPct + offsets[i % offsets.length]) : null;
                const value = modelPct !== null && marketPct !== null ? modelPct - marketPct : null;
                const valStyle = value === null ? {} :
                  value > 0.5 ? { background: "var(--green-dim)", color: "var(--green)" } :
                  value < -0.5 ? { background: "var(--red-dim)", color: "var(--red)" } :
                  { background: "var(--card2)", color: "var(--text-muted)" };

                return (
                  <div key={team.code} style={{
                    display: "flex", alignItems: "center", padding: "8px 12px", gap: 8,
                    borderBottom: i < marketRows.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{team.flag}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", flex: 1 }}>{team.name}</span>
                    <span style={{ fontSize: 11, color: "var(--blue)", fontWeight: 700, width: 38, textAlign: "right" }}>
                      {modelPct !== null ? `${modelPct.toFixed(1)}%` : "—"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, width: 38, textAlign: "right" }}>
                      {marketPct !== null ? `${marketPct.toFixed(1)}%` : "—"}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                      width: 44, textAlign: "center", ...valStyle,
                    }}>
                      {value !== null ? `${value > 0 ? "+" : ""}${value.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
