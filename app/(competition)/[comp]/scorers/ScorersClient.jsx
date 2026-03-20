"use client";
import { useParams } from "next/navigation";
import { useTopScorers } from "@/lib/hooks/useTopScorers";
import TopBar from "@/components/shared/TopBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getTeamMeta } from "@/src/lib/team-meta";

export default function ScorersClient() {
  const { comp } = useParams();
  const { data, loading } = useTopScorers();

  if (loading) {
    return (
      <div>
        <TopBar comp={comp} badge />
        <LoadingSpinner />
      </div>
    );
  }

  const scorers = data?.scorers || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar comp={comp} badge />

      <div style={{
        padding: "12px 12px 6px",
        fontSize: 14, fontWeight: 800, color: "var(--text)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>⚽</span> 射手榜
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "0 12px" }}>
        {scorers.length === 0 ? (
          <div style={{
            padding: "40px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13,
          }}>
            暂无射手数据（开赛后更新）
          </div>
        ) : (
          <div style={{
            background: "var(--card)", borderRadius: 10,
            border: "1px solid var(--border)", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              background: "var(--card2)",
            }}>
              <span style={{ width: 28, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>#</span>
              <span style={{ flex: 1, fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>球员</span>
              <span style={{ width: 36, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>场</span>
              <span style={{ width: 36, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>进球</span>
              <span style={{ width: 36, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>助攻</span>
              <span style={{ width: 44, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>分钟</span>
            </div>

            {/* Player rows */}
            {scorers.map((s, i) => {
              const meta = s.teamMeta || getTeamMeta(s.team || "");
              const isTop3 = i < 3;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", padding: "10px 12px",
                  borderBottom: i < scorers.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{
                    width: 28, textAlign: "center", fontSize: 12,
                    fontWeight: 800, fontVariantNumeric: "tabular-nums",
                    color: isTop3 ? "var(--blue)" : "var(--text3)",
                  }}>
                    {isTop3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: "var(--text)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {s.player}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
                      <span>{meta.flag}</span>
                      <span>{meta.shortName}</span>
                    </div>
                  </div>
                  <span style={{
                    width: 36, textAlign: "center", fontSize: 11,
                    color: "var(--text2)", fontVariantNumeric: "tabular-nums",
                  }}>{s.matches}</span>
                  <span style={{
                    width: 36, textAlign: "center", fontSize: 14,
                    fontWeight: 900, color: "var(--text)",
                    fontVariantNumeric: "tabular-nums",
                  }}>{s.goals}</span>
                  <span style={{
                    width: 36, textAlign: "center", fontSize: 11,
                    color: "var(--text2)", fontVariantNumeric: "tabular-nums",
                  }}>{s.assists}</span>
                  <span style={{
                    width: 44, textAlign: "center", fontSize: 10,
                    color: "var(--text3)", fontVariantNumeric: "tabular-nums",
                  }}>{s.minutes}&apos;</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
