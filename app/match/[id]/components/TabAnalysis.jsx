"use client";

import { useState, useMemo } from "react";
import { computeAHAtLine, computeOUAtLine } from "@/lib/poisson";
import SectionLabel from "./SectionLabel";
import { SourceBadge, CompareRow, DiscrepancyBar } from "./CompareRow";

/** Convert decimal odds to implied probabilities with vig removed */
function oddsToProb(home, draw, away) {
  const sum = 1/home + 1/draw + 1/away;
  return {
    home: Math.round((1/home) / sum * 100),
    draw: Math.round((1/draw) / sum * 100),
    away: Math.round((1/away) / sum * 100),
  };
}

/* OddCell helper */
function OddCell({ value, highlight, color }) {
  const colorMap = { blue: "var(--blue)", red: "var(--red)", dim: "var(--text2)" };
  return (
    <span style={{
      width: 56, textAlign: "center", fontSize: 13,
      fontWeight: highlight ? 800 : 600,
      fontVariantNumeric: "tabular-nums",
      color: highlight ? colorMap[color] : "var(--text2)",
    }}>
      {typeof value === "number" ? value.toFixed(2) : value}
    </span>
  );
}

export default function TabAnalysis({ data, poissonOdds, fixture }) {
  const [showFullOdds, setShowFullOdds] = useState(false);
  const odds = data?.odds;

  // Extract bookmaker 1X2 (use first bookmaker or average)
  const ftOdds = odds?.["1X2"] || [];
  const bookOdds1X2 = ftOdds.length > 0 ? ftOdds[0] : null;
  const bookProb = bookOdds1X2
    ? oddsToProb(bookOdds1X2.home, bookOdds1X2.draw, bookOdds1X2.away)
    : null;

  // Model data
  const modelResult = poissonOdds?.result;
  const modelAH = poissonOdds?.asianHandicap;
  const modelOU = poissonOdds?.overUnder;
  const modelBtts = poissonOdds?.btts;
  const modelCorners = poissonOdds?.corners;
  const modelCS = poissonOdds?.correctScore;

  // Helper: convert bookmaker decimal odds to implied probability (2-way)
  function odds2prob(a, b) {
    if (!a || !b || a <= 0 || b <= 0) return null;
    const sum = 1/a + 1/b;
    return { a: Math.round((1/a) / sum * 100), b: Math.round((1/b) / sum * 100) };
  }

  // Find bookmaker AH line matching model line (or closest available)
  const bookAHAll = odds?.asian_handicap_all || [];
  const bookAH = useMemo(() => {
    if (!bookAHAll.length) return odds?.asian_handicap || null;
    if (!modelAH) return bookAHAll[0] || null;
    const exact = bookAHAll.find((b) => b.line === modelAH.line);
    if (exact) return exact;
    return bookAHAll.reduce((best, cur) =>
      Math.abs(cur.line - modelAH.line) < Math.abs(best.line - modelAH.line) ? cur : best
    );
  }, [bookAHAll, modelAH, odds?.asian_handicap]);

  // Find bookmaker O/U line matching model line (or closest available)
  const bookOUAll = odds?.over_under_all || [];
  const bookOU = useMemo(() => {
    if (!bookOUAll.length) return odds?.over_under || null;
    if (!modelOU) return bookOUAll.find((o) => o.line === 2.5) || bookOUAll[0] || null;
    const exact = bookOUAll.find((b) => b.line === modelOU.line);
    if (exact) return exact;
    return bookOUAll.reduce((best, cur) =>
      Math.abs(cur.line - modelOU.line) < Math.abs(best.line - modelOU.line) ? cur : best
    );
  }, [bookOUAll, modelOU, odds?.over_under]);

  // When bookmaker line differs from model's auto-picked line,
  // recalculate model probability at the SAME line for fair comparison
  const displayModelAH = useMemo(() => {
    if (!modelAH || !bookAH) return modelAH;
    if (modelAH.line === bookAH.line) return modelAH;
    if (poissonOdds?.lambdaHome && poissonOdds?.lambdaAway) {
      return computeAHAtLine(poissonOdds.lambdaHome, poissonOdds.lambdaAway, bookAH.line);
    }
    return modelAH;
  }, [modelAH, bookAH, poissonOdds]);

  const displayModelOU = useMemo(() => {
    if (!modelOU || !bookOU) return modelOU;
    if (modelOU.line === bookOU.line) return modelOU;
    if (poissonOdds?.lambdaHome && poissonOdds?.lambdaAway) {
      return computeOUAtLine(poissonOdds.lambdaHome, poissonOdds.lambdaAway, bookOU.line);
    }
    return modelOU;
  }, [modelOU, bookOU, poissonOdds]);

  const bookAHProb = bookAH ? odds2prob(bookAH.home, bookAH.away) : null;
  const bookOUProb = bookOU ? odds2prob(bookOU.over, bookOU.under) : null;

  // Highlight when model and bookmaker disagree by > 5 percentage points
  const discrepancyThreshold = 5;
  function getHighlight(modelPct, bookPct) {
    if (modelPct == null || bookPct == null) return null;
    const diff = Math.abs(modelPct - bookPct);
    if (diff < discrepancyThreshold) return null;
    return modelPct > bookPct ? "model" : "book";
  }

  // No data at all
  if (!poissonOdds && !odds) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        暂无分析数据
      </div>
    );
  }

  return (
    <div style={{ padding: "12px" }}>
      {/* Section 1: 1X2 Three-Way Comparison */}
      <div style={{
        background: "var(--card)", borderRadius: 10,
        border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
      }}>
        <div style={{ padding: "10px 12px 6px" }}>
          <SectionLabel>胜平负 (1X2) 三方对比</SectionLabel>
        </div>

        {/* Visual comparison bars */}
        <DiscrepancyBar
          values={[
            modelResult ? [modelResult.homeWin, modelResult.draw, modelResult.awayWin] : null,
            bookProb ? [bookProb.home, bookProb.draw, bookProb.away] : null,
          ]}
          colors={["#7c8aef", "#e8a838"]}
          labels={["模型", "机构"]}
        />

        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "56px 1fr 1fr 1fr",
          padding: "6px 12px", borderBottom: "1px solid var(--border)",
        }}>
          <span />
          <div style={{ textAlign: "center" }}><SourceBadge label="模型" color="#7c8aef" /></div>
          <div style={{ textAlign: "center" }}><SourceBadge label="机构" color="#e8a838" /></div>
          <div style={{ textAlign: "center" }}><SourceBadge label="市场" color="#4caf50" /></div>
        </div>

        {/* Rows */}
        <CompareRow
          label="主胜"
          modelVal={modelResult ? `${modelResult.homeWin}%` : null}
          bookVal={bookProb ? `${bookProb.home}%` : null}
          bookSub={bookOdds1X2 ? bookOdds1X2.home.toFixed(2) : null}
          marketVal="即将上线"
          highlight={getHighlight(modelResult?.homeWin, bookProb?.home)}
        />
        <CompareRow
          label="平局"
          modelVal={modelResult ? `${modelResult.draw}%` : null}
          bookVal={bookProb ? `${bookProb.draw}%` : null}
          bookSub={bookOdds1X2 ? bookOdds1X2.draw.toFixed(2) : null}
          marketVal="即将上线"
          highlight={getHighlight(modelResult?.draw, bookProb?.draw)}
        />
        <CompareRow
          label="客胜"
          modelVal={modelResult ? `${modelResult.awayWin}%` : null}
          bookVal={bookProb ? `${bookProb.away}%` : null}
          bookSub={bookOdds1X2 ? bookOdds1X2.away.toFixed(2) : null}
          marketVal="即将上线"
          highlight={getHighlight(modelResult?.awayWin, bookProb?.away)}
        />

        {/* Bookmaker name */}
        {bookOdds1X2 && (
          <div style={{
            padding: "4px 12px 8px", fontSize: 9, color: "var(--text3)", textAlign: "right",
          }}>
            机构数据: {bookOdds1X2.bookmaker}
          </div>
        )}
      </div>

      {/* Section 2: Asian Handicap Comparison */}
      {(displayModelAH || bookAH) && (() => {
        const ahLine = bookAH?.line ?? displayModelAH?.line;
        const fmtLine = (l) => l > 0 ? `+${l}` : l === 0 ? "0" : String(l);
        return (
      <div style={{
        background: "var(--card)", borderRadius: 10,
        border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
      }}>
        <div style={{ padding: "10px 12px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <SectionLabel>亚洲盘口对比</SectionLabel>
          {ahLine != null && (
            <span style={{
              fontSize: 11, fontWeight: 800, color: "var(--text)",
              background: "var(--card2, rgba(255,255,255,0.06))", padding: "2px 8px", borderRadius: 4,
            }}>{fmtLine(ahLine)}</span>
          )}
        </div>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "56px 1fr 1fr 1fr",
          padding: "6px 12px", borderBottom: "1px solid var(--border)",
        }}>
          <span />
          <div style={{ textAlign: "center" }}><SourceBadge label="模型" color="#7c8aef" /></div>
          <div style={{ textAlign: "center" }}><SourceBadge label="机构" color="#e8a838" /></div>
          <div style={{ textAlign: "center" }}><SourceBadge label="市场" color="#4caf50" /></div>
        </div>

        {/* Home */}
        <CompareRow
          label="主队"
          modelVal={displayModelAH ? `${displayModelAH.home}%` : null}
          bookVal={bookAHProb ? `${bookAHProb.a}%` : null}
          bookSub={bookAH?.home ? bookAH.home.toFixed(2) : null}
          highlight={getHighlight(displayModelAH?.home, bookAHProb?.a)}
        />
        <CompareRow
          label="客队"
          modelVal={displayModelAH ? `${displayModelAH.away}%` : null}
          bookVal={bookAHProb ? `${bookAHProb.b}%` : null}
          bookSub={bookAH?.away ? bookAH.away.toFixed(2) : null}
          highlight={getHighlight(displayModelAH?.away, bookAHProb?.b)}
        />

        {bookAH?.bookmaker && (
          <div style={{
            padding: "4px 12px 8px", fontSize: 9, color: "var(--text3)", textAlign: "right",
          }}>
            {bookAH.bookmaker}
          </div>
        )}
      </div>
        );
      })()}

      {/* Section 3: Over/Under Comparison */}
      {(displayModelOU || bookOU) && (() => {
        const ouLine = bookOU?.line ?? displayModelOU?.line;
        return (
      <div style={{
        background: "var(--card)", borderRadius: 10,
        border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
      }}>
        <div style={{ padding: "10px 12px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <SectionLabel>大小球对比</SectionLabel>
          {ouLine != null && (
            <span style={{
              fontSize: 11, fontWeight: 800, color: "var(--text)",
              background: "var(--card2, rgba(255,255,255,0.06))", padding: "2px 8px", borderRadius: 4,
            }}>{ouLine}</span>
          )}
        </div>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "56px 1fr 1fr 1fr",
          padding: "6px 12px", borderBottom: "1px solid var(--border)",
        }}>
          <span />
          <div style={{ textAlign: "center" }}><SourceBadge label="模型" color="#7c8aef" /></div>
          <div style={{ textAlign: "center" }}><SourceBadge label="机构" color="#e8a838" /></div>
          <div style={{ textAlign: "center" }}><SourceBadge label="市场" color="#4caf50" /></div>
        </div>

        {/* Over */}
        <CompareRow
          label="大球"
          modelVal={displayModelOU ? `${displayModelOU.over}%` : null}
          bookVal={bookOUProb ? `${bookOUProb.a}%` : null}
          bookSub={bookOU?.over ? bookOU.over.toFixed(2) : null}
          highlight={getHighlight(displayModelOU?.over, bookOUProb?.a)}
        />
        <CompareRow
          label="小球"
          modelVal={displayModelOU ? `${displayModelOU.under}%` : null}
          bookVal={bookOUProb ? `${bookOUProb.b}%` : null}
          bookSub={bookOU?.under ? bookOU.under.toFixed(2) : null}
          highlight={getHighlight(displayModelOU?.under, bookOUProb?.b)}
        />

        {bookOU?.bookmaker && (
          <div style={{
            padding: "4px 12px 8px", fontSize: 9, color: "var(--text3)", textAlign: "right",
          }}>
            {bookOU.bookmaker}
          </div>
        )}
      </div>
        );
      })()}

      {/* Section 4: Model Exclusive Analysis */}
      {poissonOdds && (
        <div style={{
          background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
        }}>
          <div style={{
            padding: "10px 12px 6px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <SectionLabel>模型独有分析</SectionLabel>
            <span style={{ fontSize: 8, color: "var(--text3)", fontWeight: 600, opacity: 0.6 }}>
              λ {poissonOdds.lambdaHome} – {poissonOdds.lambdaAway}
            </span>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 1, background: "var(--border)",
          }}>
            {/* BTTS */}
            {modelBtts && (
              <div style={{ background: "var(--card)", padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700, marginBottom: 6, letterSpacing: "0.04em" }}>
                  双方进球
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{modelBtts.yes}%</div>
                    <div style={{ fontSize: 9, color: "var(--text3)" }}>是</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text2)" }}>{modelBtts.no}%</div>
                    <div style={{ fontSize: 9, color: "var(--text3)" }}>否</div>
                  </div>
                </div>
              </div>
            )}

            {/* Corners */}
            {modelCorners && (
              <div style={{ background: "var(--card)", padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700, marginBottom: 6, letterSpacing: "0.04em" }}>
                  角球预测
                </div>
                {/* Expected corners */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--blue)" }}>{modelCorners.homeExpected}</span>
                  <span style={{ fontSize: 9, color: "var(--text3)" }}>预期总 {modelCorners.totalExpected}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#e05252" }}>{modelCorners.awayExpected}</span>
                </div>
                {/* Corner O/U probabilities */}
                {modelCorners.overUnder && modelCorners.overUnder.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {modelCorners.overUnder.map((ou) => {
                      const isOver = ou.over > 50;
                      return (
                        <div key={ou.line} style={{
                          flex: 1, minWidth: 60, textAlign: "center",
                          background: "var(--card2, rgba(255,255,255,0.04))", borderRadius: 6, padding: "5px 3px",
                        }}>
                          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, marginBottom: 2 }}>
                            {ou.line}
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                              color: isOver ? "var(--green, #4caf50)" : "var(--text2)",
                            }}>大{ou.over}%</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                              color: !isOver ? "var(--orange, #ff9800)" : "var(--text2)",
                            }}>小{ou.under}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Correct Score */}
          {modelCS && modelCS.length > 0 && (
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700, marginBottom: 6, letterSpacing: "0.04em" }}>
                最可能比分
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {modelCS.slice(0, 5).map((s, i) => (
                  <div key={i} style={{
                    flex: 1, minWidth: 48, textAlign: "center",
                    background: "var(--card2, rgba(255,255,255,0.04))", borderRadius: 6, padding: "6px 4px",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? "var(--blue)" : "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                      {s.score}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text3)" }}>{s.prob}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model info */}
          <div style={{
            padding: "6px 14px 8px", borderTop: "1px solid var(--border)",
            fontSize: 8, color: "var(--text3)", opacity: 0.5, textAlign: "center",
          }}>
            Dixon-Coles 泊松模型 · 基于球队历史攻防数据 · 每日更新
          </div>
        </div>
      )}

      {/* Section 5: Full Bookmaker Odds (collapsible) */}
      {ftOdds.length > 0 && (
        <div style={{
          background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border)", overflow: "hidden", marginBottom: 10,
        }}>
          <div
            onClick={() => setShowFullOdds(!showFullOdds)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", cursor: "pointer",
              borderBottom: showFullOdds ? "1px solid var(--border)" : "none",
            }}
          >
            <SectionLabel>完整博彩赔率</SectionLabel>
            <span style={{
              fontSize: 11, color: "var(--text3)", fontWeight: 600,
              transform: showFullOdds ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              display: "inline-block",
            }}>▼</span>
          </div>

          {showFullOdds && (
            <>
              {/* Header */}
              <div style={{
                display: "flex", padding: "6px 12px",
                borderBottom: "1px solid var(--border)",
              }}>
                <span style={{ flex: 1, fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>博彩公司</span>
                <span style={{ width: 56, fontSize: 9, color: "var(--blue)", fontWeight: 700, textAlign: "center" }}>
                  {fixture.home.name}
                </span>
                <span style={{ width: 56, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>
                  平局
                </span>
                <span style={{ width: 56, fontSize: 9, color: "var(--red)", fontWeight: 700, textAlign: "center" }}>
                  {fixture.away.name}
                </span>
              </div>
              {/* Rows */}
              {ftOdds.map((o, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", padding: "8px 12px",
                  borderBottom: i < ftOdds.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ flex: 1, fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
                    {o.bookmaker}
                  </span>
                  <OddCell value={o.home} highlight={o.home <= o.draw && o.home <= o.away} color="blue" />
                  <OddCell value={o.draw} highlight={false} color="dim" />
                  <OddCell value={o.away} highlight={o.away <= o.draw && o.away <= o.home} color="red" />
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div style={{ height: 12 }} />
    </div>
  );
}
