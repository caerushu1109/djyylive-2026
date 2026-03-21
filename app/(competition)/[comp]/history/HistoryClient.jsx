"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import TopBar from "@/components/shared/TopBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useHistoryData } from "@/lib/hooks/useHistoryData";
import { PlayerProvider, useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";

const SUB_TABS = ["冠军", "射手", "球队", "纪录", "决赛"];

// Player name EN→ZH mapping (loaded once)
let _playerZh = null;
function usePlayerZh() {
  const [map, setMap] = useState(_playerZh);
  useEffect(() => {
    if (_playerZh) return;
    fetch("/data/history/player-names-zh.json")
      .then(r => r.json())
      .then(d => { _playerZh = d; setMap(d); })
      .catch(() => {});
  }, []);
  return map || {};
}
function zhName(map, name) {
  return map[name] || name;
}

// ── 共用样式 ──
const cardStyle = {
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", overflow: "hidden",
};
const headerStyle = {
  fontSize: 11, fontWeight: 800, color: "var(--text2)",
  textTransform: "uppercase", letterSpacing: "0.06em",
  padding: "10px 12px", background: "var(--card2)",
  borderBottom: "1px solid var(--border)",
};

// ══════════════════════════════════════════════════════════════════
// Tab 1: 历届冠军
// ══════════════════════════════════════════════════════════════════
function ChampionsTab() {
  const { data, loading } = useHistoryData("champions");
  const router = useRouter();
  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { timeline, titleRanking } = data;

  return (
    <div style={{ padding: "12px 12px 80px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 冠军次数 */}
      <div style={cardStyle}>
        <div style={headerStyle}>冠军次数</div>
        <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {titleRanking.map(({ team, count }) => (
            <div key={team} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "var(--card2)", borderRadius: 6, padding: "5px 10px",
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--gold)" }}>{count}</span>
              <span onClick={() => router.push(`/team/${encodeURIComponent(team)}`)} style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{team}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 时间轴 */}
      <div style={cardStyle}>
        <div style={headerStyle}>历届世界杯 (1930-2022)</div>
        {timeline.slice().reverse().map((t, i) => (
          <div key={t.year} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px",
            borderBottom: i < timeline.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{
              fontSize: 13, fontWeight: 900, color: "var(--gold)",
              width: 38, flexShrink: 0, fontVariantNumeric: "tabular-nums",
            }}>{t.year}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                <span onClick={() => router.push(`/team/${encodeURIComponent(t.winner)}`)} style={{ cursor: "pointer" }}>{t.winner}</span>
                <span style={{ color: "var(--text3)", fontWeight: 400 }}> vs <span onClick={() => router.push(`/team/${encodeURIComponent(t.runnerUp)}`)} style={{ cursor: "pointer" }}>{t.runnerUp}</span></span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>
                {t.host} · {t.teams}队
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                {t.score}
              </div>
              {t.extra && (
                <div style={{
                  fontSize: 8, fontWeight: 700, color: "var(--blue)",
                  background: "var(--blue-dim)", borderRadius: 3, padding: "1px 4px",
                  display: "inline-block", marginTop: 1,
                }}>{t.extra}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Tab 2: 射手殿堂
// ══════════════════════════════════════════════════════════════════
function ScorersTab() {
  const { data, loading } = useHistoryData("scorers");
  const pzh = usePlayerZh();
  const [showAll, setShowAll] = useState(false);
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();
  const router = useRouter();
  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { allTime, goldenBoots } = data;
  const FOLD = 20;
  const visible = showAll ? allTime : allTime.slice(0, FOLD);

  return (
    <div style={{ padding: "12px 12px 80px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 历史射手榜 */}
      <div style={cardStyle}>
        <div style={headerStyle}>历史总射手榜</div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 12px", gap: 4, borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 22, fontSize: 9, color: "var(--text3)", padding: "6px 0" }}>#</span>
          <span style={{ flex: 1, fontSize: 9, color: "var(--text3)" }}>球员</span>
          <span style={{ width: 28, fontSize: 9, color: "var(--text3)", textAlign: "center" }}>球队</span>
          <span style={{ width: 28, fontSize: 9, color: "var(--text3)", textAlign: "center" }}>届</span>
          <span style={{ width: 32, fontSize: 9, color: "var(--text3)", textAlign: "right" }}>进球</span>
        </div>
        {visible.map((s, i) => {
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <div key={s.name} style={{
              display: "flex", alignItems: "center", padding: "7px 12px", gap: 4,
              borderBottom: i < visible.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ width: 22, fontSize: 10, fontWeight: 700, color: i < 3 ? "var(--gold)" : "var(--text3)" }}>
                {i < 3 ? medals[i] : i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: "var(--text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  cursor: "pointer" }} onClick={() => { const id = lookup(s.name); if (id) openPlayer(id, zhName(pzh, s.name)); }}>{zhName(pzh, s.name)}</div>
                <div style={{ fontSize: 9, color: "var(--text3)" }}>{s.span}</div>
              </div>
              <span onClick={() => router.push(`/team/${encodeURIComponent(s.team)}`)} style={{ width: 28, fontSize: 10, color: "var(--text2)", textAlign: "center", cursor: "pointer" }}>{s.team}</span>
              <span style={{ width: 28, fontSize: 10, color: "var(--text3)", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{s.tournaments}</span>
              <span style={{
                width: 32, fontSize: 14, fontWeight: 900, textAlign: "right",
                color: i === 0 ? "var(--gold)" : "var(--text)", fontVariantNumeric: "tabular-nums",
              }}>{s.goals}</span>
            </div>
          );
        })}
        {allTime.length > FOLD && (
          <button onClick={() => setShowAll(v => !v)} style={{
            width: "100%", padding: "10px", background: "none", border: "none",
            borderTop: "1px solid var(--border)", cursor: "pointer",
            fontSize: 11, fontWeight: 700, color: "var(--blue)",
          }}>
            {showAll ? "↑ 收起" : `↓ 显示更多 (${allTime.length - FOLD})`}
          </button>
        )}
      </div>

      {/* 历届金靴 */}
      <div style={cardStyle}>
        <div style={headerStyle}>历届金靴奖</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
          {goldenBoots.slice().reverse().map((gb, i) => (
            <div key={`${gb.year}-${i}`} style={{
              flex: "1 0 50%", minWidth: "50%", boxSizing: "border-box",
              padding: "7px 12px",
              borderBottom: "1px solid var(--border)",
              borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--gold)" }}>{gb.year}</div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                cursor: "pointer" }} onClick={() => { const id = lookup(gb.player); if (id) openPlayer(id, zhName(pzh, gb.player)); }}>{zhName(pzh, gb.player)}</div>
              <div onClick={() => router.push(`/team/${encodeURIComponent(gb.team)}`)} style={{ fontSize: 9, color: "var(--text3)", cursor: "pointer" }}>{gb.team}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Tab 3: 球队档案
// ══════════════════════════════════════════════════════════════════
function TeamsTab() {
  const { data, loading } = useHistoryData("teams");
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const FOLD = 16;
  const visible = showAll ? data : data.slice(0, FOLD);

  return (
    <div style={{ padding: "12px 12px 80px" }}>
      <div style={cardStyle}>
        <div style={headerStyle}>球队历史战绩排行</div>
        {/* Column header */}
        <div style={{
          display: "flex", alignItems: "center", padding: "5px 12px", gap: 4,
          borderBottom: "1px solid var(--border)", background: "var(--card2)",
        }}>
          <span style={{ width: 18, fontSize: 9, color: "var(--text3)" }}>#</span>
          <span style={{ flex: 1, fontSize: 9, color: "var(--text3)" }}>球队</span>
          <span style={{ width: 22, fontSize: 9, color: "var(--text3)", textAlign: "center" }}>届</span>
          <span style={{ width: 22, fontSize: 9, color: "var(--text3)", textAlign: "center" }}>场</span>
          <span style={{ width: 22, fontSize: 9, color: "var(--text3)", textAlign: "center" }}>胜</span>
          <span style={{ width: 22, fontSize: 9, color: "var(--text3)", textAlign: "center" }}>平</span>
          <span style={{ width: 22, fontSize: 9, color: "var(--text3)", textAlign: "center" }}>负</span>
          <span style={{ width: 28, fontSize: 9, color: "var(--text3)", textAlign: "center" }}>净胜</span>
          <span style={{ width: 36, fontSize: 9, color: "var(--text3)", textAlign: "right" }}>最佳</span>
        </div>
        {visible.map((t, i) => (
          <div key={t.team} style={{
            display: "flex", alignItems: "center", padding: "7px 12px", gap: 4,
            borderBottom: i < visible.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{ width: 18, fontSize: 10, fontWeight: 700, color: "var(--text3)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                cursor: "pointer" }} onClick={() => router.push(`/team/${encodeURIComponent(t.team)}`)}>{t.team}</span>
              {t.titles > 0 && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "var(--gold)", flexShrink: 0 }}>
                  ×{t.titles}🏆
                </span>
              )}
            </div>
            {[t.appearances, t.p, t.w, t.d, t.l].map((v, j) => (
              <span key={j} style={{
                width: 22, fontSize: 11, color: "var(--text2)", textAlign: "center",
                fontVariantNumeric: "tabular-nums",
              }}>{v}</span>
            ))}
            <span style={{
              width: 28, fontSize: 11, textAlign: "center", fontVariantNumeric: "tabular-nums",
              color: t.gd > 0 ? "var(--green)" : t.gd < 0 ? "var(--red)" : "var(--text3)",
            }}>
              {t.gd > 0 ? `+${t.gd}` : t.gd}
            </span>
            <span style={{
              width: 36, fontSize: 9, fontWeight: 700, textAlign: "right",
              color: t.best === "冠军" ? "var(--gold)" : "var(--text2)",
            }}>{t.best}</span>
          </div>
        ))}
        {data.length > FOLD && (
          <button onClick={() => setShowAll(v => !v)} style={{
            width: "100%", padding: "10px", background: "none", border: "none",
            borderTop: "1px solid var(--border)", cursor: "pointer",
            fontSize: 11, fontWeight: 700, color: "var(--blue)",
          }}>
            {showAll ? "↑ 收起" : `↓ 显示更多 (${data.length - FOLD})`}
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Tab 4: 经典纪录
// ══════════════════════════════════════════════════════════════════
function RecordsTab() {
  const { data, loading } = useHistoryData("records");
  const pzh = usePlayerZh();
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();
  const router = useRouter();
  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const Section = ({ title, children }) => (
    <div style={{ ...cardStyle, marginBottom: 12 }}>
      <div style={headerStyle}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ padding: "12px 12px 80px" }}>
      {/* 最大比分差 */}
      <Section title="最大比分差">
        {data.biggestWins.slice(0, 10).map((m, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "7px 12px", gap: 8,
            borderBottom: i < 9 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", width: 36, fontVariantNumeric: "tabular-nums" }}>
              {m.score}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span onClick={() => router.push(`/team/${encodeURIComponent(m.winner)}`)} style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{m.winner}</span>
              <span style={{ fontSize: 11, color: "var(--text3)" }}> vs <span onClick={() => router.push(`/team/${encodeURIComponent(m.loser)}`)} style={{ cursor: "pointer" }}>{m.loser}</span></span>
            </div>
            <span style={{ fontSize: 10, color: "var(--text3)", flexShrink: 0 }}>{m.year}</span>
          </div>
        ))}
      </Section>

      {/* 帽子戏法 */}
      <Section title="帽子戏法">
        {data.hatTricks.slice(0, 12).map((h, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "7px 12px", gap: 8,
            borderBottom: i < 11 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{
              fontSize: 13, fontWeight: 900, width: 24,
              color: h.goals >= 4 ? "var(--gold)" : "var(--text)",
            }}>
              {h.goals}球
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                cursor: "pointer" }} onClick={() => { const id = lookup(h.player); if (id) openPlayer(id, zhName(pzh, h.player)); }}>{zhName(pzh, h.player)}</div>
              <div onClick={() => router.push(`/team/${encodeURIComponent(h.team)}`)} style={{ fontSize: 9, color: "var(--text3)", cursor: "pointer" }}>{h.team}</div>
            </div>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>{h.year}</span>
          </div>
        ))}
      </Section>

      {/* 最快进球 */}
      <Section title="最快进球">
        {data.fastestGoals.slice(0, 10).map((g, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "7px 12px", gap: 8,
            borderBottom: i < 9 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{
              fontSize: 12, fontWeight: 900, color: "var(--green)", width: 32,
              fontVariantNumeric: "tabular-nums",
            }}>{g.minute}&apos;</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                cursor: "pointer" }} onClick={() => { const id = lookup(g.player); if (id) openPlayer(id, zhName(pzh, g.player)); }}>{zhName(pzh, g.player)}</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>{g.team}{g.vs ? ` vs ${g.vs}` : ""}</div>
            </div>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>{g.year}</span>
          </div>
        ))}
      </Section>

      {/* 点球大战 */}
      <Section title={`点球大战 (${data.penaltyShootouts.length}次)`}>
        {data.penaltyShootouts.slice().reverse().slice(0, 12).map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "7px 12px", gap: 8,
            borderBottom: i < 11 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", width: 36, fontVariantNumeric: "tabular-nums" }}>
              {p.pens}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{p.teams}</div>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>{p.stage}</div>
            </div>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>{p.year}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Tab 5: 决赛回顾
// ══════════════════════════════════════════════════════════════════
function FinalsTab() {
  const { data, loading } = useHistoryData("finals");
  const pzh = usePlayerZh();
  const [expanded, setExpanded] = useState(null);
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();
  const router = useRouter();
  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  return (
    <div style={{ padding: "12px 12px 80px" }}>
      <div style={cardStyle}>
        <div style={headerStyle}>22届世界杯决赛</div>
        {data.slice().reverse().map((f, i) => {
          const isOpen = expanded === f.year;
          return (
            <div key={f.year}>
              <div
                onClick={() => setExpanded(isOpen ? null : f.year)}
                style={{
                  display: "flex", alignItems: "center", padding: "9px 12px", gap: 8,
                  borderBottom: "1px solid var(--border)", cursor: "pointer",
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: 900, color: "var(--gold)",
                  width: 38, flexShrink: 0, fontVariantNumeric: "tabular-nums",
                }}>{f.year}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                    <span onClick={(e) => { e.stopPropagation(); router.push(`/team/${encodeURIComponent(f.home)}`); }} style={{ cursor: "pointer" }}>{f.home}</span> <span style={{ color: "var(--text3)" }}>vs</span> <span onClick={(e) => { e.stopPropagation(); router.push(`/team/${encodeURIComponent(f.away)}`); }} style={{ cursor: "pointer" }}>{f.away}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                    {f.score}
                  </span>
                  {f.penalties && (
                    <span style={{
                      fontSize: 9, color: "var(--blue)", fontWeight: 700,
                      marginLeft: 4,
                    }}>PK {f.penScore}</span>
                  )}
                  {f.extraTime && !f.penalties && (
                    <span style={{ fontSize: 9, color: "var(--blue)", fontWeight: 700, marginLeft: 4 }}>AET</span>
                  )}
                </div>
                <span style={{
                  fontSize: 11, color: "var(--text3)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}>▾</span>
              </div>
              {isOpen && (
                <div style={{
                  padding: "8px 12px 10px", paddingLeft: 50,
                  background: "var(--card2)", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6 }}>
                    {f.stadium}, {f.city}
                  </div>
                  {f.goals.length > 0 ? f.goals.map((g, j) => (
                    <div key={j} style={{
                      fontSize: 11, color: "var(--text2)", padding: "2px 0",
                      display: "flex", gap: 6,
                    }}>
                      <span style={{ color: "var(--text3)", width: 30, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                        {g.minute}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        <span onClick={() => { const id = lookup(g.player); if (id) openPlayer(id, zhName(pzh, g.player)); }} style={{ cursor: "pointer" }}>{zhName(pzh, g.player)}</span>
                        {g.penalty && <span style={{ color: "var(--blue)", marginLeft: 3 }}>(PK)</span>}
                        {g.ownGoal && <span style={{ color: "var(--red)", marginLeft: 3 }}>(乌龙)</span>}
                      </span>
                      <span style={{ color: "var(--text3)", marginLeft: "auto" }}>{g.team}</span>
                    </div>
                  )) : (
                    <div style={{ fontSize: 10, color: "var(--text3)" }}>进球详情暂无</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 主页面
// ══════════════════════════════════════════════════════════════════
export default function HistoryClient() {
  return (
    <PlayerProvider>
      <HistoryClientInner />
    </PlayerProvider>
  );
}

function HistoryClientInner() {
  const { comp } = useParams();
  const [subTab, setSubTab] = useState("冠军");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar comp={comp} label="世界杯历史" />

      {/* Sub tabs */}
      <div style={{
        display: "flex", padding: "0 12px", gap: 2, flexShrink: 0,
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
              letterSpacing: "0.04em",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {subTab === "冠军" && <ChampionsTab />}
        {subTab === "射手" && <ScorersTab />}
        {subTab === "球队" && <TeamsTab />}
        {subTab === "纪录" && <RecordsTab />}
        {subTab === "决赛" && <FinalsTab />}
      </div>
    </div>
  );
}
