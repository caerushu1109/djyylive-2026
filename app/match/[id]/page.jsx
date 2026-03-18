"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMatchDetail } from "@/lib/hooks/useMatchDetail";
import Badge from "@/components/ui/Badge";
import TabBar from "@/components/ui/TabBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft } from "lucide-react";

const DETAIL_TABS = [
  { id: "stats", label: "统计" },
  { id: "events", label: "事件" },
  { id: "h2h", label: "历史对决" },
];

function StatRow({ label, left, right, leftWidth }) {
  return (
    <div style={{ padding: "8px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{left}</span>
        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{right}</span>
      </div>
      <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", background: "var(--border)" }}>
        <div style={{ width: `${leftWidth}%`, background: "var(--blue)", transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function EventItem({ event }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "8px 14px",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 28 }}>{event.minute}</span>
      <span style={{ fontSize: 18 }}>{event.icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{event.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{event.subtitle}</div>
      </div>
    </div>
  );
}

function ProbBar({ home, draw, away, homeFlag, awayFlag }) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", marginBottom: 8, gap: 2 }}>
        <div style={{ flex: home, height: 6, background: "var(--blue)", borderRadius: "3px 0 0 3px" }} />
        <div style={{ flex: draw, height: 6, background: "var(--text-dim)" }} />
        <div style={{ flex: away, height: 6, background: "var(--red)", borderRadius: "0 3px 3px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)" }}>
        <span>{homeFlag} {home}%</span>
        <span>平 {draw}%</span>
        <span>{away}% {awayFlag}</span>
      </div>
    </div>
  );
}

function ScoreBoard({ fixture }) {
  const { home, away, homeScore, awayScore, stage, status, minute } = fixture;
  const statusLabel = status === "LIVE" ? (minute || "LIVE") : status === "FT" ? "终场" : "未开始";
  return (
    <div style={{ padding: "20px 16px", textAlign: "center" }}>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--text-dim)" }}>{stage}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 36 }}>{home.flag}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{home.name}</div>
        </div>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          {status !== "NS" ? (
            <div style={{ fontSize: 36, fontWeight: 800 }}>
              {homeScore ?? "—"} – {awayScore ?? "—"}
            </div>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 300, color: "var(--text-dim)" }}>VS</div>
          )}
          <div style={{ marginTop: 6 }}>
            <Badge tone={status === "LIVE" ? "live" : status === "FT" ? "ft" : "ns"}>
              {statusLabel}
            </Badge>
          </div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 36 }}>{away.flag}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{away.name}</div>
        </div>
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

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50, gap: 8,
      }}>
        <button onClick={() => router.back()} style={{ padding: 4, marginLeft: -4 }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>比赛详情</span>
      </div>

      {loading && <LoadingSpinner />}

      {data && (
        <>
          <ScoreBoard fixture={data.fixture} />

          {data.probabilities && (
            <div style={{
              margin: "0 16px 16px",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 12, overflow: "hidden",
            }}>
              <ProbBar
                home={data.probabilities.home}
                draw={data.probabilities.draw}
                away={data.probabilities.away}
                homeFlag={data.fixture.home.flag}
                awayFlag={data.fixture.away.flag}
              />
            </div>
          )}

          <div style={{
            position: "sticky", top: "var(--topbar-h)", zIndex: 40,
            background: "var(--bg)", borderBottom: "1px solid var(--border)",
            padding: "8px 0",
          }}>
            <TabBar tabs={DETAIL_TABS} active={tab} onChange={setTab} />
          </div>

          <div style={{ marginTop: 8 }}>
            {tab === "stats" && (
              <div style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, margin: "0 16px", overflow: "hidden",
              }}>
                {data.fixture.status === "NS" ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>
                    比赛尚未开始
                  </div>
                ) : (data.stats || []).map((stat, i) => (
                  <div key={i} style={{ borderBottom: i < (data.stats.length - 1) ? "1px solid var(--border)" : "none" }}>
                    <StatRow {...stat} />
                  </div>
                ))}
              </div>
            )}

            {tab === "events" && (
              <div style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, margin: "0 16px", overflow: "hidden",
              }}>
                {!data.events?.length ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>
                    暂无事件数据
                  </div>
                ) : data.events.map((event, i) => (
                  <EventItem key={i} event={event} />
                ))}
              </div>
            )}

            {tab === "h2h" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {(data.h2hSummary || []).map((item, i) => (
                    <div key={i} style={{
                      flex: 1, textAlign: "center",
                      background: "var(--card)", border: "1px solid var(--border)",
                      borderRadius: 8, padding: "10px 4px",
                    }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--blue)" }}>{item.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: 12, overflow: "hidden",
                }}>
                  {(data.h2hMatches || []).length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>
                      暂无历史对决数据
                    </div>
                  ) : data.h2hMatches.map((match, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px",
                      borderBottom: i < data.h2hMatches.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <span style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 36 }}>{match.year}</span>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text-dim)" }}>{match.event}</span>
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

          <div style={{ height: 32 }} />
        </>
      )}
    </div>
  );
}
