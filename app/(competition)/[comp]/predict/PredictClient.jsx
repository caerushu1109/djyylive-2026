"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/shared/TopBar";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { usePolymarket } from "@/lib/hooks/usePolymarket";
import { EN_TO_ZH } from "@/lib/polymarket-names";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Radio, GitCompareArrows, BarChart3, Home, RefreshCw } from "lucide-react";

const FOLD_AT = 15;
const SUB_TABS = ["ELO模型", "市场对比"];

const STAGE_CONFIG = [
  { label: "32",  key: "pQualify",  color: "#22c55e" },
  { label: "16",  key: "pR16",      color: "#84cc16" },
  { label: "8",   key: "pQF",       color: "#eab308" },
  { label: "4",   key: "pSF",       color: "#f97316" },
  { label: "决",  key: "pFinal",    color: "#a855f7" },
  { label: "冠",  key: "pChampion", color: "var(--gold)" },
];

// ── 差值信号 ──
function getSignal(diff) {
  if (diff > 1.5) return { color: "var(--green)", label: "低估" };
  if (diff < -1.5) return { color: "var(--red)", label: "高估" };
  return { color: "var(--text3)", label: "持平" };
}

// ── ELO 模型 Tab ──
function EloTab({ predData, participants }) {
  const [showAll, setShowAll] = useState(false);

  const partMap = Object.fromEntries(
    participants
      .filter((p) => p.nameZh && p.nameZh !== p.nameEn)
      .map((p) => [p.nameZh, p])
  );
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
    <div style={{ padding: "0 12px 80px" }}>
      {/* Info banner */}
      <div style={{
        marginBottom: 12,
        background: "var(--blue-dim)", border: "1px solid rgba(92,158,255,0.2)",
        borderRadius: "var(--radius-sm)", padding: "10px 12px",
        fontSize: 11, color: "var(--text2)", lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4, fontSize: 11 }}>
          ELO 蒙特卡洛模型
        </div>
        基于 51,246 场国际比赛的历史 ELO 数据，对 964 场世界杯正赛 (1930–2022) 进行回测校准。根据各队最新 ELO 分算出每场胜负概率，模拟 10,000 次完整赛事（含48队真实淘汰赛对阵），统计各阶段晋级率。
        <div style={{
          marginTop: 6, paddingTop: 6,
          borderTop: "1px solid rgba(92,158,255,0.15)",
          display: "flex", flexWrap: "wrap", gap: "4px 12px",
          fontSize: 10, color: "var(--text3)",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><BarChart3 size={10} strokeWidth={2} /> 回测 <b style={{ color: "var(--text2)" }}>964</b> 场世界杯</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Home size={10} strokeWidth={2} /> 东道主 <b style={{ color: "var(--text2)" }}>+110 ELO</b></span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><RefreshCw size={10} strokeWidth={2} /> 每日 18:00 更新</span>
        </div>
      </div>

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
            <span style={{ fontSize: 11, color: "var(--text3)", width: 18, fontWeight: 700, flexShrink: 0, paddingTop: 2 }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center", paddingTop: 1 }}>{team.flag}</span>
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
            <span style={{
              fontSize: 11, fontWeight: 700, width: 40,
              textAlign: "right", flexShrink: 0,
              color: "var(--text2)",
              fontVariantNumeric: "tabular-nums",
              paddingTop: 2,
            }}>
              {team.elo ?? "—"}
            </span>
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
  );
}

// ── Polymarket 面板 ──
function PolymarketPanel({ teams }) {
  if (!teams || teams.length === 0) {
    return (
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "28px 16px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 13, color: "var(--text3)" }}>Polymarket 数据暂时不可用</div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
          API 可能受网络限制，请稍后刷新重试
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
      gap: 8, marginBottom: 4,
    }}>
      {teams.slice(0, 20).map((team) => (
        <div key={team.name} style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 8px 8px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>{team.flag || "🏴"}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "var(--text)",
            textAlign: "center", lineHeight: 1.2,
            maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {team.zhName || team.name}
          </span>
          <span style={{
            fontSize: 14, fontWeight: 900, color: "var(--purple)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {team.probability.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 信号表 ──
function SignalTable({ mergedTeams }) {
  const [showAll, setShowAll] = useState(false);
  const FOLD = 15;

  if (!mergedTeams || mergedTeams.length === 0) {
    return (
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "20px 16px",
        textAlign: "center", fontSize: 13, color: "var(--text3)",
      }}>
        暂无可比较数据（需要 Polymarket 与 ELO 数据同时可用）
      </div>
    );
  }

  const visible = showAll ? mergedTeams : mergedTeams.slice(0, FOLD);
  const hiddenCount = Math.max(0, mergedTeams.length - FOLD);

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 68px 68px 52px",
        gap: 4, padding: "0 0 6px",
        borderBottom: "1px solid var(--border2)", marginBottom: 2,
      }}>
        <span style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>球队</span>
        <span style={{ fontSize: 9, color: "var(--text3)", textAlign: "right" }}>ELO模型</span>
        <span style={{ fontSize: 9, color: "var(--text3)", textAlign: "right" }}>Polymarket</span>
        <span style={{ fontSize: 9, color: "var(--text3)", textAlign: "right" }}>差值</span>
      </div>

      {visible.map((team) => {
        const sig = getSignal(team.diff);
        return (
          <div key={team.name} style={{
            display: "grid", gridTemplateColumns: "1fr 68px 68px 52px",
            gap: 4, padding: "8px 0",
            borderBottom: "1px solid var(--border)", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{team.flag || "🏴"}</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {team.name}
              </span>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, color: "var(--text2)",
              textAlign: "right", fontVariantNumeric: "tabular-nums",
            }}>
              {team.modelPct !== null ? `${team.modelPct.toFixed(1)}%` : "—"}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: "var(--purple)",
              textAlign: "right", fontVariantNumeric: "tabular-nums",
            }}>
              {team.marketPct !== null ? `${team.marketPct.toFixed(1)}%` : "—"}
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
              {team.diff !== null ? (
                <>
                  <span style={{
                    fontSize: 11, fontWeight: 900, color: sig.color,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {team.diff > 0 ? "+" : ""}{team.diff.toFixed(1)}%
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: sig.color,
                    background: `${sig.color}18`,
                    borderRadius: 4, padding: "1px 4px",
                  }}>
                    {sig.label}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: "var(--text3)" }}>—</span>
              )}
            </div>
          </div>
        );
      })}

      {mergedTeams.length > FOLD && (
        <button
          onClick={() => setShowAll((v) => !v)}
          style={{
            width: "100%", padding: "11px 0",
            background: "none", border: "none",
            borderBottom: "1px solid var(--border)",
            cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--blue)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {showAll
            ? <>↑ 收起</>
            : <>↓ 显示更多（还有 {hiddenCount} 支球队）</>}
        </button>
      )}
    </div>
  );
}

// ── 市场对比 Tab ──
function MarketTab({ predData, polyData, polyLoading }) {
  const predMap = Object.fromEntries(
    (predData?.teams || []).map((t) => [t.name, t])
  );

  const polyTeams = (polyData?.teams || []).map((t) => {
    const zhName = EN_TO_ZH[t.name];
    const pred = zhName ? predMap[zhName] : null;
    return { ...t, zhName: zhName || t.name, flag: pred?.flag || null };
  }).filter((t) => t.probability > 0);

  const polyByZh = Object.fromEntries(
    polyTeams.map((t) => [t.zhName, t.probability])
  );

  const mergedTeams = (predData?.teams || [])
    .map((t) => {
      const modelPct = t.pChampion ?? t.probabilityValue ?? null;
      const marketPct = polyByZh[t.name] ?? null;
      const diff = (modelPct !== null && marketPct !== null) ? modelPct - marketPct : null;
      return { name: t.name, flag: t.flag, modelPct, marketPct, diff };
    })
    .sort((a, b) => {
      const hasA = a.marketPct !== null ? 1 : 0;
      const hasB = b.marketPct !== null ? 1 : 0;
      if (hasA !== hasB) return hasB - hasA;
      return (b.modelPct || 0) - (a.modelPct || 0);
    });

  const signalTeams = mergedTeams.filter((t) => t.diff !== null);
  const undervalued = signalTeams.filter((t) => t.diff > 1.5).length;
  const overvalued  = signalTeams.filter((t) => t.diff < -1.5).length;

  if (polyLoading) return <LoadingSpinner />;

  return (
    <div style={{ padding: "0 12px 80px" }}>
      {/* Info banner */}
      <div style={{
        marginBottom: 12,
        background: "rgba(179,136,255,0.05)", border: "1px solid rgba(179,136,255,0.2)",
        borderRadius: "var(--radius-sm)", padding: "8px 12px",
        fontSize: 11, color: "var(--text2)", lineHeight: 1.5,
      }}>
        聚合 Polymarket 去中心化预测市场的实时夺冠赔率，与 ELO 蒙特卡洛模型概率对比，识别市场低估或高估的球队。
      </div>

      {/* Polymarket 面板 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Radio size={14} strokeWidth={2} style={{ color: "var(--purple)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>Polymarket 夺冠赔率</span>
        <span style={{
          fontSize: 10, color: "var(--text3)",
          background: "var(--card2)", borderRadius: 4, padding: "2px 6px",
        }}>
          实时市场
        </span>
      </div>

      <PolymarketPanel teams={polyTeams} />

      {/* 模型 vs 市场信号 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24, marginBottom: 10 }}>
        <GitCompareArrows size={14} strokeWidth={2} style={{ color: "var(--blue)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>模型 vs 市场信号</span>
        <span style={{
          fontSize: 10, color: "var(--text3)",
          background: "var(--card2)", borderRadius: 4, padding: "2px 6px",
        }}>
          差值 &gt; 1.5% 为信号
        </span>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        {[
          { color: "var(--green)", label: "低估（模型 > 市场 +1.5%）" },
          { color: "var(--red)",   label: "高估（市场 > 模型 +1.5%）" },
          { color: "var(--text3)", label: "持平" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 10, color: "var(--text3)" }}>{label}</span>
          </div>
        ))}
      </div>

      <SignalTable mergedTeams={mergedTeams} />

      {signalTeams.length > 0 && (
        <div style={{
          marginTop: 12, padding: "10px 12px",
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          display: "flex", gap: 16, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>
            已比较 <span style={{ color: "var(--text)", fontWeight: 700 }}>{signalTeams.length}</span> 支球队
          </span>
          {undervalued > 0 && (
            <span style={{ fontSize: 10, color: "var(--green)" }}>低估信号 {undervalued} 支</span>
          )}
          {overvalued > 0 && (
            <span style={{ fontSize: 10, color: "var(--red)" }}>高估信号 {overvalued} 支</span>
          )}
        </div>
      )}

      <div style={{
        marginTop: 24, padding: "12px",
        background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)", fontSize: 11, color: "var(--text3)", lineHeight: 1.6,
      }}>
        ⚠️ <strong style={{ color: "var(--text2)" }}>免责声明：</strong>
        本页面仅展示预测模型数据与第三方预测市场数据的对比分析，供参考学习，
        <strong style={{ color: "var(--text2)" }}>不构成任何投注、投资或交易建议</strong>。
        Polymarket 为去中心化预测市场平台，参与前请了解相关法律法规与风险。
      </div>

      <div style={{
        marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap",
        fontSize: 10, color: "var(--text3)",
      }}>
        {predData?.updatedAt && (
          <span>ELO 模型更新：{new Date(predData.updatedAt).toLocaleString("zh-CN", {
            month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}</span>
        )}
        {polyData?.fetchedAt && (
          <span>
            Polymarket 抓取：{new Date(polyData.fetchedAt).toLocaleString("zh-CN", {
              month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
            {polyData.error && (
              <span style={{ color: "var(--red)", marginLeft: 4 }}>(暂不可用)</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// ── 主页面 ──
export default function PredictClient({ predData: initialPredData, participants }) {
  const { comp } = useParams();
  const [subTab, setSubTab] = useState("ELO模型");

  // Client-side hooks for live updates
  const { data: livePredData } = usePredictions();
  const { data: polyData, loading: polyLoading } = usePolymarket();

  const predData = livePredData || initialPredData;

  return (
    <div>
      <TopBar
        comp={comp}
        label="夺冠预测"
        right={predData?.updatedAt && (
          <span style={{ fontSize: 10, color: "var(--text3)" }}>
            更新 {new Date(predData.updatedAt).toLocaleDateString("zh-CN")}
          </span>
        )}
      />

      {/* Sub tabs */}
      <div style={{
        display: "flex", padding: "0 12px", gap: 4, flexShrink: 0,
        background: "var(--bg)", borderBottom: "1px solid var(--border)",
      }}>
        {SUB_TABS.map((t) => (
          <button
            key={t} onClick={() => setSubTab(t)}
            style={{
              flex: 1, textAlign: "center", padding: "9px 0",
              fontSize: 10, fontWeight: 700,
              color: subTab === t ? "var(--blue)" : "var(--text3)",
              borderBottom: subTab === t ? "2px solid var(--blue)" : "2px solid transparent",
              textTransform: "uppercase", letterSpacing: "0.05em",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "ELO模型" ? (
        <EloTab predData={predData} participants={participants} />
      ) : (
        <MarketTab predData={predData} polyData={polyData} polyLoading={polyLoading} />
      )}
    </div>
  );
}
