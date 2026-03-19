"use client";
import { useParams } from "next/navigation";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { useWc2026Participants } from "@/lib/hooks/useWc2026Participants";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function PredictPage() {
  const { comp } = useParams();
  const { data: predData, loading: predLoading } = usePredictions();
  const { participants, loading: partLoading } = useWc2026Participants();

  const loading = predLoading || partLoading;

  // Build a lookup: nameZh → participant config
  const partMap = Object.fromEntries(
    participants.map(p => [p.nameZh, p])
  );
  const partNames = new Set(participants.map(p => p.nameZh));

  // Filter predictions to only WC2026 teams, sort by probability descending
  const allTeams = predData?.teams || [];
  const wcTeams = allTeams
    .filter(t => partNames.has(t.name))
    .sort((a, b) => (b.probabilityValue || 0) - (a.probabilityValue || 0));

  const maxProb = wcTeams[0]?.probabilityValue || 1;

  // TBD slots: participants with no match in predictions (shouldn't happen, but safe)
  const tbdSlots = participants.filter(p => p.status === "tbd");

  const confirmedCount = participants.filter(p => p.status === "confirmed").length;
  const uncertainCount = participants.filter(p => p.status === "uncertain").length;
  const tbdCount = tbdSlots.length;

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
        {predData?.updatedAt && (
          <span style={{ fontSize: 10, color: "var(--text3)" }}>
            更新 {new Date(predData.updatedAt).toLocaleDateString("zh-CN")}
          </span>
        )}
      </div>

      {/* Info banner */}
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
        基于 ELO 排名的蒙特卡洛模拟（10,000次），仅含 2026 世界杯参赛队 · 名单每日自动同步
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ padding: "0 12px 80px" }}>

          {/* Ranked teams */}
          {wcTeams.map((team, i) => {
            const cfg = partMap[team.name] || {};
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
                  opacity: isUncertain ? 0.72 : 1,
                }}
              >
                {/* Rank */}
                <span style={{
                  fontSize: 11, color: "var(--text3)",
                  width: 18, fontWeight: 700, flexShrink: 0,
                }}>
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
                        whiteSpace: "nowrap",
                      }}>
                        资格存疑
                      </span>
                    )}
                  </div>
                  {isUncertain && cfg.note && (
                    <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 1 }}>
                      {cfg.note}
                    </div>
                  )}
                </div>

                {/* Probability bar */}
                <div style={{
                  width: 72, height: 4,
                  background: "var(--card2)",
                  borderRadius: 999, overflow: "hidden", flexShrink: 0,
                }}>
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

          {/* TBD slots from participants (inter-conf playoffs etc.) */}
          {tbdSlots.length > 0 && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "var(--text3)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "14px 0 6px",
              }}>
                待定席位
              </div>
              {tbdSlots.map((slot, i) => (
                <div
                  key={`tbd-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "9px 0",
                    gap: 8,
                    borderBottom: "1px solid var(--border)",
                    opacity: 0.4,
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text3)", width: 18, fontWeight: 700, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>🏳️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>待定</div>
                    {slot.note && (
                      <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 1 }}>{slot.note}</div>
                    )}
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
            <span style={{ fontSize: 10, color: "var(--text3)" }}>已确认 {confirmedCount} 队</span>
            {uncertainCount > 0 && (
              <span style={{ fontSize: 10, color: "var(--gold)" }}>存疑 {uncertainCount} 队</span>
            )}
            {tbdCount > 0 && (
              <span style={{ fontSize: 10, color: "var(--text3)" }}>待定 {tbdCount} 席</span>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
