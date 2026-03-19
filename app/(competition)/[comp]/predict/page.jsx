"use client";
import { useParams } from "next/navigation";
import { usePredictions } from "@/lib/hooks/usePredictions";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { WC2026_NAMES, WC2026_MAP, WC2026_TBD } from "@/src/lib/wc2026-teams";

export default function PredictPage() {
  const { comp } = useParams();
  const { data, loading } = usePredictions();

  // Filter to WC 2026 participants only, then sort by probability descending
  const allTeams = data?.teams || [];
  const wcTeams = allTeams
    .filter(t => WC2026_NAMES.has(t.name))
    .sort((a, b) => (b.probabilityValue || 0) - (a.probabilityValue || 0));

  const maxProb = wcTeams[0]?.probabilityValue || 1;

  return (
    <div>
      {/* TopBar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 16px 8px",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
            DJ<span style={{ color: "var(--blue)" }}>YY</span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>夺冠预测</span>
        </div>
        {data?.updatedAt && (
          <span style={{ fontSize: 10, color: "var(--text3)" }}>
            更新 {new Date(data.updatedAt).toLocaleDateString("zh-CN")}
          </span>
        )}
      </div>

      {/* Method note */}
      <div style={{
        margin: "0 12px 12px",
        background: "var(--blue-dim)",
        border: "1px solid rgba(92,158,255,0.2)",
        borderRadius: "var(--radius-sm)",
        padding: "8px 12px",
        fontSize: 11,
        color: "var(--text2)",
        lineHeight: 1.5,
      }}>
        基于 ELO 排名的蒙特卡洛模拟（10,000次），仅含 2026 世界杯 48 支参赛队。
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ padding: "0 12px 80px" }}>

          {/* Confirmed + uncertain teams ranked by probability */}
          {wcTeams.map((team, i) => {
            const cfg = WC2026_MAP[team.name] || {};
            const isUncertain = cfg.status === "uncertain";
            const pct = team.probabilityValue || 0;
            const barWidth = maxProb > 0 ? (pct / maxProb) * 100 : 0;

            return (
              <div
                key={team.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "9px 0",
                  gap: 8,
                  borderBottom: "1px solid var(--border)",
                  opacity: isUncertain ? 0.7 : 1,
                }}
              >
                {/* Rank */}
                <span style={{ fontSize: 11, color: "var(--text3)", width: 18, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </span>

                {/* Flag */}
                <span style={{ fontSize: 18, flexShrink: 0 }}>{team.flag}</span>

                {/* Name + uncertain badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: isUncertain ? "var(--gold)" : "var(--text)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {team.name}
                    </span>
                    {isUncertain && (
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        background: "var(--gold-dim)",
                        border: "1px solid rgba(255,193,7,0.35)",
                        color: "var(--gold)",
                        borderRadius: 4,
                        padding: "1px 5px",
                        flexShrink: 0,
                      }}>
                        资格存疑
                      </span>
                    )}
                  </div>
                  {isUncertain && cfg.note && (
                    <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 1 }}>{cfg.note}</div>
                  )}
                </div>

                {/* Probability bar */}
                <div style={{ width: 72, height: 4, background: "var(--card2)", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
                  <div style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: isUncertain
                      ? "linear-gradient(90deg, var(--gold), #ff9800)"
                      : "linear-gradient(90deg, var(--blue), var(--purple))",
                  }} />
                </div>

                {/* Percentage */}
                <span style={{
                  fontSize: 12, fontWeight: 900,
                  color: isUncertain ? "var(--gold)" : "var(--text)",
                  width: 40, textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}

          {/* TBD placeholder slots */}
          {WC2026_TBD.length > 0 && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "var(--text3)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "14px 0 6px",
              }}>
                附加赛席位
              </div>
              {WC2026_TBD.map((slot, i) => (
                <div
                  key={`tbd-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "9px 0",
                    gap: 8,
                    borderBottom: "1px solid var(--border)",
                    opacity: 0.45,
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text3)", width: 18, fontWeight: 700, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>🏳️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>待定</div>
                    <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 1 }}>{slot.note}</div>
                  </div>
                  <div style={{ width: 72, height: 4, background: "var(--card2)", borderRadius: 999, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--text3)", width: 40, textAlign: "right", flexShrink: 0 }}>—</span>
                </div>
              ))}
            </>
          )}

          {/* Summary footer */}
          <div style={{
            marginTop: 16,
            padding: "10px 12px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>
              已确认 {wcTeams.filter(t => (WC2026_MAP[t.name]?.status || "confirmed") === "confirmed").length} 队
            </span>
            <span style={{ fontSize: 10, color: "var(--gold)" }}>
              存疑 {wcTeams.filter(t => WC2026_MAP[t.name]?.status === "uncertain").length} 队
            </span>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>
              待定 {WC2026_TBD.length} 席
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
