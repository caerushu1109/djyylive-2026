"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { useWc2026Participants } from "@/lib/hooks/useWc2026Participants";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const FOLD_AT = 15;

const STAGE_CONFIG = [
  { label: "32",  key: "pQualify",  color: "#22c55e" },
  { label: "16",  key: "pR16",      color: "#84cc16" },
  { label: "8",   key: "pQF",       color: "#eab308" },
  { label: "4",   key: "pSF",       color: "#f97316" },
  { label: "决",  key: "pFinal",    color: "#a855f7" },
  { label: "冠",  key: "pChampion", color: "var(--gold)" },
];

export default function PredictPage() {
  const { comp } = useParams();
  const { data: predData, loading: predLoading } = usePredictions();
  const { participants, loading: partLoading } = useWc2026Participants();
  const loading = predLoading || partLoading;
  const [showAll, setShowAll] = useState(false);

  // Badge lookup: nameZh → participant config
  const partMap = Object.fromEntries(
    participants
      .filter((p) => p.nameZh && p.nameZh !== p.nameEn)
      .map((p) => [p.nameZh, p])
  );

  // English name lookup for team detail links
  const enNameMap = Object.fromEntries(
    participants.map((p) => [p.nameZh, p.nameEn])
  );

  const allTeams = predData?.teams || [];
  const wcTeams  = allTeams.sort((a, b) => (b.probabilityValue || 0) - (a.probabilityValue || 0));

  const confirmedCount = wcTeams.length;
  const uncertainCount = wcTeams.filter((t) => partMap[t.name]?.status === "uncertain").length;
  const tbdCount       = Math.max(0, 48 - confirmedCount);

  const visibleTeams = showAll ? wcTeams : wcTeams.slice(0, FOLD_AT);
  const hiddenCount  = Math.max(0, wcTeams.length - FOLD_AT);

  return (
    <div>
      {/* TopBar */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 16px 8px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={`/${comp}`} style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
            DJ<span style={{ color: "var(--blue)" }}>YY</span>
          </Link>
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
        background: "var(--blue-dim)", border: "1px solid rgba(92,158,255,0.2)",
        borderRadius: "var(--radius-sm)", padding: "8px 12px",
        fontSize: 11, color: "var(--text2)", lineHeight: 1.5,
      }}>
        用各队 ELO 分算出每场胜负概率，模拟 10,000 次完整赛事，统计各阶段晋级率。每天北京时间 08:00 自动更新。
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ padding: "0 12px 80px" }}>

          {/* Column headers */}
          <div style={{
            display: "flex", alignItems: "center",
            padding: "0 0 5px", gap: 8,
            borderBottom: "1px solid var(--border2)",
            marginBottom: 2,
          }}>
            <span style={{ fontSize: 9, color: "var(--text3)", width: 18, flexShrink: 0 }}>#</span>
            <span style={{ fontSize: 9, color: "var(--text3)", width: 24, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 9, color: "var(--text3)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>球队 / 晋级概率</span>
            <span style={{ fontSize: 9, color: "var(--text3)", width: 40, textAlign: "right", flexShrink: 0 }}>ELO</span>
            <span style={{ fontSize: 9, color: "var(--text3)", width: 36, textAlign: "right", flexShrink: 0 }}>夺冠%</span>
          </div>

          {visibleTeams.map((team, i) => {
            const cfg         = partMap[team.name] || {};
            const isUncertain = cfg.status === "uncertain";
            const pct         = team.probabilityValue || 0;
            const teamEn      = enNameMap[team.name] || team.name;
            const teamHref    = `/team/${encodeURIComponent(teamEn)}`;
            const hasStages   = team.pQualify !== undefined;

            return (
              <Link
                key={team.name}
                href={teamHref}
                style={{
                  display: "flex", alignItems: "flex-start",
                  padding: "8px 0", gap: 8,
                  borderBottom: "1px solid var(--border)",
                  opacity: isUncertain ? 0.72 : 1,
                  textDecoration: "none", color: "inherit",
                }}
              >
                {/* Rank */}
                <span style={{ fontSize: 11, color: "var(--text3)", width: 18, fontWeight: 700, flexShrink: 0, paddingTop: 2 }}>
                  {i + 1}
                </span>

                {/* Flag */}
                <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center", paddingTop: 1 }}>{team.flag}</span>

                {/* Name + badge + stage probabilities */}
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
                        background: "var(--gold-dim)", border: "1px solid rgba(255,193,7,0.35)",
                        color: "var(--gold)", borderRadius: 4, padding: "1px 5px",
                        flexShrink: 0, whiteSpace: "nowrap",
                      }}>
                        资格存疑
                      </span>
                    )}
                    {isUncertain && cfg.note && (
                      <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 1 }}>{cfg.note}</div>
                    )}
                  </div>

                  {/* 6-stage probability chips */}
                  {hasStages && (
                    <div style={{ display: "flex", gap: 3, marginTop: 5, flexWrap: "nowrap" }}>
                      {STAGE_CONFIG.map(({ label, key, color }) => {
                        const v = team[key];
                        const display = v === undefined ? "—"
                          : v < 0.5 ? "<1%"
                          : `${Math.round(v)}%`;
                        return (
                          <div key={key} style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            background: "var(--card2)", borderRadius: 4, padding: "2px 5px",
                            minWidth: 30, flexShrink: 0,
                          }}>
                            <span style={{ fontSize: 8, color: "var(--text3)", lineHeight: 1, marginBottom: 1 }}>{label}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 800, color,
                              lineHeight: 1, fontVariantNumeric: "tabular-nums",
                            }}>
                              {display}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ELO score */}
                <span style={{
                  fontSize: 11, fontWeight: 700, width: 40,
                  textAlign: "right", flexShrink: 0,
                  color: "var(--text2)",
                  fontVariantNumeric: "tabular-nums",
                  paddingTop: 2,
                }}>
                  {team.elo ?? "—"}
                </span>

                {/* Champion probability */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0, width: 36, paddingTop: 2 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 900,
                    color: isUncertain ? "var(--gold)" : "var(--text)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Expand / Collapse */}
          {wcTeams.length > FOLD_AT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              style={{
                width: "100%", padding: "11px 0",
                background: "none", border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                fontSize: 12, fontWeight: 700,
                color: "var(--blue)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {showAll
                ? <>↑ 收起</>
                : <>↓ 显示更多（还有 {hiddenCount} 支球队）</>
              }
            </button>
          )}

          {/* TBD slots — only shown when expanded */}
          {tbdCount > 0 && showAll && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "var(--text3)",
                textTransform: "uppercase", letterSpacing: "0.08em", padding: "14px 0 6px",
              }}>
                待定席位（附加赛）
              </div>
              {Array.from({ length: tbdCount }).map((_, idx) => (
                <div key={`tbd-${idx}`} style={{
                  display: "flex", alignItems: "center", padding: "9px 0", gap: 8,
                  borderBottom: "1px solid var(--border)", opacity: 0.35,
                }}>
                  <span style={{ fontSize: 11, color: "var(--text3)", width: 18, fontWeight: 700, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: "center" }}>🏳️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>待定</div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text3)", width: 40, textAlign: "right", flexShrink: 0 }}>—</span>
                  <div style={{ width: 36, flexShrink: 0, textAlign: "right" }}>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>—</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Summary footer */}
          <div style={{
            marginTop: 16, padding: "10px 12px",
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>已出线 {confirmedCount} 队</span>
            {uncertainCount > 0 && (
              <span style={{ fontSize: 10, color: "var(--gold)" }}>存疑 {uncertainCount} 队</span>
            )}
            {tbdCount > 0 && (
              <span style={{ fontSize: 10, color: "var(--text3)" }}>附加赛待定 {tbdCount} 席</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
