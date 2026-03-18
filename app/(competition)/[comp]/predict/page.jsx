"use client";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { useElo } from "@/lib/hooks/useElo";
import PredictionChart from "@/components/shared/PredictionChart";
import SectionTitle from "@/components/ui/SectionTitle";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TrendingUp, Info } from "lucide-react";

export default function PredictPage() {
  const { data: predData, loading: predLoading } = usePredictions();
  const { data: eloData, loading: eloLoading } = useElo();

  const teams = predData?.teams?.filter((t) => !t.placeholder) || [];

  return (
    <div>
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <TrendingUp size={18} style={{ color: "var(--blue)", marginRight: 8 }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>夺冠预测</span>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          display: "flex", gap: 8, padding: "10px 12px",
          background: "rgba(92,158,255,0.08)",
          border: "1px solid rgba(92,158,255,0.2)",
          borderRadius: 8,
        }}>
          <Info size={14} style={{ color: "var(--blue)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
            {predData?.method || "基于 ELO 排名的蒙特卡洛模拟（10,000次），计算各队夺冠概率。"}
            {predData?.updatedAt && (
              <span style={{ display: "block", marginTop: 2, opacity: 0.6 }}>
                更新于 {new Date(predData.updatedAt).toLocaleDateString("zh-CN")}
              </span>
            )}
          </p>
        </div>

        <section>
          <SectionTitle>夺冠概率排名</SectionTitle>
          {predLoading ? <LoadingSpinner /> : (
            <PredictionChart teams={teams} showElo={true} />
          )}
        </section>

        {!eloLoading && eloData && (
          <section>
            <SectionTitle>当前 ELO 排名（前 20）</SectionTitle>
            <div style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 12, overflow: "hidden",
            }}>
              {(eloData.rankings || []).slice(0, 20).map((row, i) => (
                <div key={row.code} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px",
                  borderBottom: i < 19 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{
                    width: 24, textAlign: "right", fontSize: 12,
                    color: i < 3 ? "var(--gold)" : "var(--text-dim)",
                    fontWeight: 600,
                  }}>{row.rank}</span>
                  <span style={{ fontSize: 20 }}>{row.flag}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{row.name}</span>
                  <span style={{ fontSize: 13, color: "var(--blue)", fontFamily: "var(--font-mono)" }}>
                    {row.elo}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
