"use client";
import { useParams } from "next/navigation";
import { usePredictions } from "@/lib/hooks/usePredictions";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function PredictPage() {
  const { comp } = useParams();
  const { data, loading } = usePredictions();
  const teams = (data?.teams || []).filter(t => !t.placeholder);
  const maxProb = teams[0]?.prob || 1;

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
        margin: "12px 12px 8px",
        background: "var(--blue-dim)",
        border: "1px solid rgba(92,158,255,0.2)",
        borderRadius: "var(--radius-sm)",
        padding: "8px 12px",
        fontSize: 11,
        color: "var(--text2)",
        lineHeight: 1.5,
      }}>
        {data?.method || "基于 ELO 排名的蒙特卡洛模拟（10,000次），计算各队夺冠概率。"}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ padding: "0 12px 80px" }}>
          {teams.map((team, i) => {
            const pct = team.prob !== undefined ? team.prob * 100 : 0;
            const barWidth = maxProb > 0 ? (team.prob / maxProb) * 100 : 0;
            return (
              <div
                key={team.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "9px 0",
                  gap: 8,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--text3)", width: 18, fontWeight: 700 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{team.flag}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", flex: 1 }}>{team.name}</span>
                <div style={{ width: 80, height: 4, background: "var(--card2)", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg, var(--blue), var(--purple))",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "var(--text)",
                    width: 42,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
