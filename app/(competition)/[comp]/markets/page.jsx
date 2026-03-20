"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { usePolymarket } from "@/lib/hooks/usePolymarket";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Activity, TrendingUp } from "lucide-react";
import { EN_TO_ZH } from "@/lib/polymarket-names";

// 差值 > 1.5% 绿色（低估），< -1.5% 红色（高估），其余灰色
function getSignal(diff) {
  if (diff > 1.5) return { color: "var(--green)", label: "低估" };
  if (diff < -1.5) return { color: "var(--red)", label: "高估" };
  return { color: "var(--text3)", label: "持平" };
}

// ---- Polymarket 面板 ----
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
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
        gap: 8,
        marginBottom: 4,
      }}>
        {teams.slice(0, 20).map((team) => (
          <div key={team.name} style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 8px 8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{team.flag || "🏴"}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "var(--text)",
              textAlign: "center", lineHeight: 1.2,
              maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
    </div>
  );
}

// ---- 模型 vs 市场信号表 ----
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
      {/* Header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 68px 68px 52px",
        gap: 4,
        padding: "0 0 6px",
        borderBottom: "1px solid var(--border2)",
        marginBottom: 2,
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
            display: "grid",
            gridTemplateColumns: "1fr 68px 68px 52px",
            gap: 4,
            padding: "8px 0",
            borderBottom: "1px solid var(--border)",
            alignItems: "center",
          }}>
            {/* Team */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{team.flag || "🏴"}</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {team.name}
              </span>
            </div>
            {/* ELO model */}
            <span style={{
              fontSize: 12, fontWeight: 700, color: "var(--text2)",
              textAlign: "right", fontVariantNumeric: "tabular-nums",
            }}>
              {team.modelPct !== null ? `${team.modelPct.toFixed(1)}%` : "—"}
            </span>
            {/* Polymarket */}
            <span style={{
              fontSize: 12, fontWeight: 700, color: "var(--purple)",
              textAlign: "right", fontVariantNumeric: "tabular-nums",
            }}>
              {team.marketPct !== null ? `${team.marketPct.toFixed(1)}%` : "—"}
            </span>
            {/* Diff + signal */}
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
            cursor: "pointer",
            fontSize: 12, fontWeight: 700,
            color: "var(--blue)",
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

// ---- 主页面 ----
export default function MarketsPage() {
  const { comp } = useParams();
  const { data: predData, loading: predLoading } = usePredictions();
  const { data: polyData, loading: polyLoading } = usePolymarket();

  const loading = predLoading || polyLoading;

  // 建立球队查找表：中文名 → 预测数据
  const predMap = Object.fromEntries(
    (predData?.teams || []).map((t) => [t.name, t])
  );

  // 将 Polymarket 英文名转换为中文名，并附加旗帜
  const polyTeams = (polyData?.teams || []).map((t) => {
    const zhName = EN_TO_ZH[t.name];
    const pred = zhName ? predMap[zhName] : null;
    return {
      ...t,
      zhName: zhName || t.name,
      flag: pred?.flag || null,
    };
  }).filter((t) => t.probability > 0);

  // 合并表格数据：以 ELO 模型球队为基础，关联 Polymarket 概率
  const polyByZh = Object.fromEntries(
    polyTeams.map((t) => [t.zhName, t.probability])
  );

  const mergedTeams = (predData?.teams || [])
    .map((t) => {
      const modelPct = t.pChampion ?? t.probabilityValue ?? null;
      const marketPct = polyByZh[t.name] ?? null;
      const diff = (modelPct !== null && marketPct !== null)
        ? modelPct - marketPct
        : null;
      return { name: t.name, flag: t.flag, modelPct, marketPct, diff };
    })
    .sort((a, b) => {
      // 两边都有数据的排前面，再按 ELO 概率降序
      const hasA = a.marketPct !== null ? 1 : 0;
      const hasB = b.marketPct !== null ? 1 : 0;
      if (hasA !== hasB) return hasB - hasA;
      return (b.modelPct || 0) - (a.modelPct || 0);
    });

  // 信号统计
  const signalTeams = mergedTeams.filter((t) => t.diff !== null);
  const undervalued = signalTeams.filter((t) => t.diff > 1.5).length;
  const overvalued  = signalTeams.filter((t) => t.diff < -1.5).length;

  return (
    <div>
      {/* TopBar */}
      <div style={{
        display: "flex", alignItems: "center", padding: "10px 16px 8px",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={`/${comp}`} style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
            DJ<span style={{ color: "var(--blue)" }}>YY</span>
          </Link>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>市场赔率</span>
        </div>
        {polyData?.fetchedAt && (
          <span style={{ fontSize: 10, color: "var(--text3)" }}>
            更新 {new Date(polyData.fetchedAt).toLocaleTimeString("zh-CN", {
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Info banner */}
      <div style={{
        margin: "0 12px 12px",
        background: "rgba(179,136,255,0.05)", border: "1px solid rgba(179,136,255,0.2)",
        borderRadius: "var(--radius-sm)", padding: "8px 12px",
        fontSize: 11, color: "var(--text2)", lineHeight: 1.5,
      }}>
        聚合 Polymarket 去中心化预测市场的实时夺冠赔率，与 ELO 蒙特卡洛模型概率对比，识别市场低估或高估的球队。
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ padding: "0 12px 80px" }}>

          {/* ───── Section 1: Polymarket 面板 ───── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Activity size={14} style={{ color: "var(--purple)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Polymarket 夺冠赔率</span>
            <span style={{
              fontSize: 10, color: "var(--text3)",
              background: "var(--card2)", borderRadius: 4, padding: "2px 6px",
            }}>
              实时市场
            </span>
          </div>

          <PolymarketPanel teams={polyTeams} />

          {/* ───── Section 2: 模型 vs 市场信号 ───── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24, marginBottom: 10 }}>
            <TrendingUp size={14} style={{ color: "var(--blue)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>模型 vs 市场信号</span>
            <span style={{
              fontSize: 10, color: "var(--text3)",
              background: "var(--card2)", borderRadius: 4, padding: "2px 6px",
            }}>
              差值 &gt; 1.5% 为信号
            </span>
          </div>

          {/* 图例 */}
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

          {/* 信号摘要 */}
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
                <span style={{ fontSize: 10, color: "var(--green)" }}>
                  低估信号 {undervalued} 支
                </span>
              )}
              {overvalued > 0 && (
                <span style={{ fontSize: 10, color: "var(--red)" }}>
                  高估信号 {overvalued} 支
                </span>
              )}
            </div>
          )}

          {/* ───── 免责声明 ───── */}
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

          {/* ───── 时间戳 ───── */}
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
      )}
    </div>
  );
}
