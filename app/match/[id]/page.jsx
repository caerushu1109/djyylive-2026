"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMatchDetail } from "@/lib/hooks/useMatchDetail";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft } from "lucide-react";

const DETAIL_TABS = [
  { id: "stats",  label: "统计" },
  { id: "events", label: "事件流" },
  { id: "h2h",   label: "H2H" },
];

function WinProb({ home, draw, away }) {
  if (home == null) return null;
  return (
    <div style={{
      background: "var(--card)", borderRadius: 10,
      margin: "0 12px 4px", padding: "10px 12px 8px", flexShrink: 0,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        实时胜负概率（滚球预测）
      </div>
      <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 6, overflow: "hidden", marginBottom: 5 }}>
        <div style={{ flex: home, background: "var(--blue)", borderRadius: "6px 0 0 6px" }} />
        <div style={{ flex: draw, background: "var(--text-muted)" }} />
        <div style={{ flex: away, background: "var(--red)", borderRadius: "0 6px 6px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>{home}%</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", flex: 1, textAlign: "center" }}>{draw}%</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--red)" }}>{away}%</span>
      </div>
    </div>
  );
}

function StatRow({ label, left, right, leftWidth }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "6px 14px", gap: 8, borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)", width: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{left}</span>
      <div style={{ flex: 1, height: 4, background: "var(--card2)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${100 - leftWidth}%`, background: "var(--red)", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${leftWidth}%`, background: "var(--blue)", borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: "var(--text-muted)", width: 60, textAlign: "center", fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "var(--card2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${100 - leftWidth}%`, height: "100%", background: "var(--red)", borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--red)", width: 32, fontVariantNumeric: "tabular-nums" }}>{right}</span>
    </div>
  );
}

function EventItem({ event }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", padding: "7px 14px", gap: 10, borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 10, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", width: 24, flexShrink: 0, marginTop: 1 }}>{event.minute}</span>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{event.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{event.title}</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{event.subtitle}</div>
      </div>
    </div>
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { data, loading } = useMatchDetail(id);
  const [tab, setTab] = useState("stats");

  const fixture = data?.fixture;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Detail topbar */}
      <div style={{
        display: "flex", alignItems: "center", padding: "8px 12px",
        gap: 10, background: "var(--surface)", borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
      }}>
        <button onClick={() => router.back()} style={{ fontSize: 18, color: "var(--text-dim)", padding: 4 }}>‹</button>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>
          {fixture?.stage || "比赛详情"}
        </span>
        {fixture?.status === "LIVE" && (
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
            background: "var(--red-dim)", border: "1px solid rgba(255,61,61,0.3)",
            borderRadius: 6, padding: "3px 8px",
          }}>
            <span style={{ width: 6, height: 6, background: "var(--live)", borderRadius: "50%", animation: "ringpulse 1.5s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 10, color: "var(--live)", fontWeight: 800 }}>
              LIVE {fixture.minute}
            </span>
          </div>
        )}
      </div>

      {loading && <LoadingSpinner />}

      {fixture && (
        <>
          {/* Score card */}
          <div style={{
            background: "linear-gradient(180deg, #151825 0%, var(--bg) 100%)",
            padding: "16px 12px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {/* Home */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>{fixture.home.flag}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", textAlign: "center" }}>{fixture.home.name}</span>
                {fixture.home.elo && (
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>ELO {fixture.home.elo}</span>
                )}
              </div>
              {/* Score center */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, padding: "0 8px" }}>
                {fixture.status !== "NS" ? (
                  <div style={{ fontSize: 38, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
                    {fixture.homeScore ?? 0}–{fixture.awayScore ?? 0}
                  </div>
                ) : (
                  <div style={{ fontSize: 22, fontWeight: 300, color: "var(--text-dim)" }}>VS</div>
                )}
                {fixture.status === "LIVE" && (
                  <div style={{ fontSize: 9, fontWeight: 800, color: "var(--live)", background: "var(--red-dim)", padding: "2px 8px", borderRadius: 4, marginTop: 2 }}>
                    {fixture.minute}'
                  </div>
                )}
                {fixture.status === "FT" && (
                  <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", background: "var(--card2)", padding: "2px 8px", borderRadius: 4, marginTop: 2 }}>
                    终场
                  </div>
                )}
                {fixture.venue && (
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 6, textAlign: "center" }}>{fixture.venue}</div>
                )}
              </div>
              {/* Away */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>{fixture.away.flag}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", textAlign: "center" }}>{fixture.away.name}</span>
                {fixture.away.elo && (
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>ELO {fixture.away.elo}</span>
                )}
              </div>
            </div>
          </div>

          {/* Win probability */}
          {data.probabilities && (
            <WinProb
              home={data.probabilities.home}
              draw={data.probabilities.draw}
              away={data.probabilities.away}
            />
          )}

          {/* Detail tabs */}
          <div style={{
            display: "flex", padding: "0 12px", gap: 4,
            background: "var(--bg)", flexShrink: 0,
            borderBottom: "1px solid var(--border)",
            position: "sticky", top: 52, zIndex: 40,
          }}>
            {DETAIL_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, textAlign: "center", padding: "9px 0",
                  fontSize: 10, fontWeight: 700,
                  color: tab === t.id ? "var(--blue)" : "var(--text-muted)",
                  borderBottom: tab === t.id ? "2px solid var(--blue)" : "2px solid transparent",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: tab === t.id ? "2px solid var(--blue)" : "2px solid transparent",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ paddingBottom: 80 }}>
            {tab === "stats" && (
              <div>
                {fixture.status === "NS" ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>比赛尚未开始</div>
                ) : (data.stats || []).map((stat, i) => (
                  <StatRow key={i} {...stat} />
                ))}
              </div>
            )}

            {tab === "events" && (
              <div>
                {!data.events?.length ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>暂无事件数据</div>
                ) : data.events.map((event, i) => (
                  <EventItem key={i} event={event} />
                ))}
              </div>
            )}

            {tab === "h2h" && (
              <div style={{ padding: "12px" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {(data.h2hSummary || []).map((item, i) => (
                    <div key={i} style={{
                      flex: 1, textAlign: "center",
                      background: "var(--card)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)", padding: "10px 4px",
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>{item.value}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                  {!(data.h2hMatches?.length) ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>暂无历史对决数据</div>
                  ) : data.h2hMatches.map((match, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px",
                      borderBottom: i < data.h2hMatches.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 36 }}>{match.year}</span>
                      <span style={{ flex: 1, fontSize: 12, color: "var(--text-dim)" }}>{match.event}</span>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: match.tone === "blue" ? "var(--blue)" : match.tone === "red" ? "var(--red)" : "var(--text-dim)",
                      }}>{match.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
