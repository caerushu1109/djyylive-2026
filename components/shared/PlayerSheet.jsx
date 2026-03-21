"use client";
import { useState, useEffect, useCallback } from "react";
import { BarChart3, ShieldHalf, Target, Zap, CircleDot } from "lucide-react";

/**
 * PlayerSheet — bottom-sheet modal for World Cup player career profile.
 *
 * Props:
 *   playerId   – string, used to fetch /data/players/{id}.json & /api/player/{id}
 *   onClose    – callback to close the sheet
 *   playerName – optional string shown while data is loading
 */
export default function PlayerSheet({ playerId, historicalId, onClose, playerName }) {
  const [historical, setHistorical] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [visible, setVisible] = useState(false);

  // Slide-in animation on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Fetch data from both sources
  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Only fetch historical if we have a valid P-XXXXX id
    const histId = historicalId || (String(playerId).startsWith("P-") ? playerId : null);
    const fetchHistorical = histId
      ? fetch(`/data/players/${histId}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      : Promise.resolve(null);

    // Only fetch live if we have a numeric SportMonks id
    const numericId = String(playerId).startsWith("P-") ? null : playerId;
    const fetchLive = numericId
      ? fetch(`/api/player/${numericId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      : Promise.resolve(null);

    Promise.all([fetchHistorical, fetchLive]).then(([hist, lv]) => {
      if (cancelled) return;
      // Even if both fail, don't show error — show minimal card with playerName
      setHistorical(hist);
      setLive(lv);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [playerId, historicalId]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 260);
  }, [onClose]);

  // ── Derived data (match build_player_profiles.py output shape) ──
  const englishName = historical?.name || live?.name || "";
  const name = playerName || englishName || "球员";
  const photo = live?.photo || null;
  const positions = historical?.positions || [];
  const birthDate = historical?.birthDate || "";
  const career = historical?.career || {};
  const tournaments = historical?.tournaments || [];
  const awards = historical?.awards || [];
  const penaltyRecord = career.penaltyShootouts || null;
  const bookings = historical?.bookings || [];

  // Career summary from pre-computed career object
  const totalTournaments = career.tournaments || tournaments.length;
  const totalApps = career.apps || 0;
  const totalGoals = career.goals || 0;
  const totalYellow = career.yellowCards || 0;
  const totalRed = career.redCards || 0;

  // Active tournament data
  const activeTournament = tournaments[activeTab] || null;

  // ── Position icon fallback ────────────────────────────────────
  const positionIcon = (pos) => {
    const p = (pos || "").toLowerCase();
    const iconStyle = { display: "inline", verticalAlign: "-2px" };
    if (p.includes("goalkeeper") || p.includes("门将")) return <ShieldHalf size={14} strokeWidth={2} color="var(--gold)" style={iconStyle} />;
    if (p.includes("defend") || p.includes("后卫")) return <ShieldHalf size={14} strokeWidth={2} color="var(--blue)" style={iconStyle} />;
    if (p.includes("midfield") || p.includes("中场")) return <Target size={14} strokeWidth={2} color="var(--green)" style={iconStyle} />;
    if (p.includes("forward") || p.includes("前锋") || p.includes("striker")) return <Zap size={14} strokeWidth={2} color="var(--red)" style={iconStyle} />;
    return <CircleDot size={14} strokeWidth={2} color="var(--text3)" style={iconStyle} />;
  };

  // ── Styles ────────────────────────────────────────────────────
  const s = {
    backdrop: {
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column",
      justifyContent: "flex-end", alignItems: "center",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.25s ease",
    },
    sheet: {
      width: "100%", maxWidth: 480,
      maxHeight: "88dvh",
      background: "var(--surface, #18181b)",
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      display: "flex", flexDirection: "column",
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      overflow: "hidden",
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      background: "var(--text3, #555)",
      margin: "10px auto 0",
      flexShrink: 0,
    },
    headerRow: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 16px 0",
      flexShrink: 0,
    },
    closeBtn: {
      background: "var(--card2, #222)", border: "none", cursor: "pointer",
      borderRadius: "50%", width: 28, height: 28,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text3)", fontSize: 14,
    },
    scrollArea: {
      flex: 1, overflowY: "auto", overflowX: "hidden",
      WebkitOverflowScrolling: "touch",
      padding: "0 16px 24px",
    },
    profileSection: {
      display: "flex", alignItems: "center", gap: 14,
      padding: "16px 0 12px",
    },
    avatar: {
      width: 64, height: 64, borderRadius: 16,
      objectFit: "cover", background: "var(--card, #1a1a1e)",
      flexShrink: 0,
    },
    avatarFallback: {
      width: 64, height: 64, borderRadius: 16,
      background: "var(--card, #1a1a1e)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 28, flexShrink: 0,
    },
    nameText: {
      fontSize: 18, fontWeight: 700, color: "var(--text)",
      lineHeight: 1.2, margin: 0,
    },
    metaText: {
      fontSize: 11, color: "var(--text3)", marginTop: 3,
    },
    summaryGrid: {
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
      gap: 8, margin: "8px 0 16px",
    },
    summaryCell: {
      background: "var(--card, #1a1a1e)",
      borderRadius: "var(--radius, 12px)",
      padding: "10px 6px", textAlign: "center",
    },
    summaryNum: {
      fontSize: 20, fontWeight: 800, color: "var(--text)",
      lineHeight: 1,
    },
    summaryLabel: {
      fontSize: 10, color: "var(--text3)", marginTop: 4,
    },
    sectionTitle: {
      fontSize: 13, fontWeight: 700, color: "var(--text-dim, #aaa)",
      margin: "16px 0 8px", letterSpacing: 0.5,
    },
    tabsRow: {
      display: "flex", gap: 6, overflowX: "auto",
      paddingBottom: 8, margin: "0 -2px",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
    },
    tab: (active) => ({
      padding: "6px 12px", borderRadius: 999,
      background: active ? "var(--blue, #3b82f6)" : "var(--card, #1a1a1e)",
      color: active ? "#fff" : "var(--text2, #ccc)",
      border: "none", cursor: "pointer",
      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
      flexShrink: 0,
      transition: "background 0.2s, color 0.2s",
    }),
    tournamentCard: {
      background: "var(--card, #1a1a1e)",
      borderRadius: "var(--radius, 12px)",
      padding: 14, marginBottom: 10,
    },
    statRow: {
      display: "flex", justifyContent: "space-between",
      alignItems: "center", padding: "5px 0",
    },
    statLabel: { fontSize: 12, color: "var(--text3)" },
    statValue: { fontSize: 13, fontWeight: 700, color: "var(--text)" },
    goalItem: {
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 10px", marginTop: 6,
      background: "var(--card2, #222)",
      borderRadius: 8,
    },
    minute: {
      fontSize: 11, fontWeight: 700, color: "var(--green, #22c55e)",
      minWidth: 32,
    },
    goalText: { fontSize: 12, color: "var(--text2)" },
    goalBadge: (type) => ({
      fontSize: 9, fontWeight: 700, padding: "1px 5px",
      borderRadius: 4, marginLeft: 6,
      background: type === "penalty" ? "var(--amber, #f59e0b)" :
                  type === "og" ? "var(--red, #ef4444)" : "transparent",
      color: "#fff",
    }),
    awardItem: {
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 10px",
      background: "var(--card, #1a1a1e)",
      borderRadius: 8, marginBottom: 6,
    },
    awardIcon: { fontSize: 20 },
    awardText: { fontSize: 12, fontWeight: 600, color: "var(--text)" },
    awardYear: { fontSize: 11, color: "var(--text3)", marginLeft: "auto" },
    penaltyBar: {
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 14px",
      background: "var(--card, #1a1a1e)",
      borderRadius: "var(--radius, 12px)",
    },
    xgPlaceholder: {
      padding: "20px 14px",
      background: "var(--card, #1a1a1e)",
      borderRadius: "var(--radius, 12px)",
      textAlign: "center",
      opacity: 0.4,
    },
    loadingContainer: {
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "60px 20px", gap: 16,
    },
    spinner: {
      width: 32, height: 32, borderRadius: "50%",
      border: "3px solid var(--card2, #222)",
      borderTopColor: "var(--blue, #3b82f6)",
      animation: "playersheet-spin 0.7s linear infinite",
    },
    errorBox: {
      padding: "40px 20px", textAlign: "center",
      color: "var(--red, #ef4444)", fontSize: 13,
    },
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      {/* Keyframe for spinner */}
      <style>{`
        @keyframes playersheet-spin {
          to { transform: rotate(360deg); }
        }
        .playersheet-tabs::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Backdrop */}
      <div onClick={handleClose} style={s.backdrop}>
        {/* Sheet */}
        <div onClick={(e) => e.stopPropagation()} style={s.sheet}>
          {/* Drag handle */}
          <div style={s.handle} />

          {/* Header with close button */}
          <div style={s.headerRow}>
            <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 600 }}>
              世界杯生涯
            </span>
            <button onClick={handleClose} style={s.closeBtn} aria-label="关闭">
              ✕
            </button>
          </div>

          {/* Scrollable content */}
          <div style={s.scrollArea}>
            {loading ? (
              <div style={s.loadingContainer}>
                <div style={s.spinner} />
                <span style={{ fontSize: 14, color: "var(--text2)" }}>
                  {playerName ? `加载 ${playerName} ...` : "加载中..."}
                </span>
              </div>
            ) : (
              <>
                {/* ── Profile Header ── */}
                <div style={s.profileSection}>
                  {photo ? (
                    <img src={photo} alt={name} style={s.avatar} />
                  ) : (
                    <div style={s.avatarFallback}>
                      {positionIcon(positions[0])}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={s.nameText}>{name}</h2>
                    {englishName && englishName !== name && (
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>
                        {englishName}
                      </div>
                    )}
                    {positions.length > 0 && (
                      <div style={s.metaText}>
                        {positions.join(" / ")}
                      </div>
                    )}
                    {birthDate && (
                      <div style={{ ...s.metaText, marginTop: 1 }}>
                        {birthDate}
                      </div>
                    )}
                    {live?.club && (
                      <div style={{ ...s.metaText, marginTop: 1, color: "var(--text2)" }}>
                        {live.club}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Career Summary Grid ── */}
                <div style={s.summaryGrid}>
                  <div style={s.summaryCell}>
                    <div style={s.summaryNum}>{totalTournaments}</div>
                    <div style={s.summaryLabel}>届</div>
                  </div>
                  <div style={s.summaryCell}>
                    <div style={s.summaryNum}>{totalApps}</div>
                    <div style={s.summaryLabel}>场</div>
                  </div>
                  <div style={s.summaryCell}>
                    <div style={s.summaryNum}>{totalGoals}</div>
                    <div style={s.summaryLabel}>球</div>
                  </div>
                  <div style={s.summaryCell}>
                    <div style={{ ...s.summaryNum, fontSize: 14 }}>
                      <span style={{ color: "var(--amber, #f59e0b)" }}>{totalYellow}</span>
                      {" / "}
                      <span style={{ color: "var(--red, #ef4444)" }}>{totalRed}</span>
                    </div>
                    <div style={s.summaryLabel}>黄牌 / 红牌</div>
                  </div>
                </div>

                {/* ── Awards ── */}
                {awards.length > 0 && (
                  <>
                    <div style={s.sectionTitle}>荣誉</div>
                    {awards.map((aw, i) => (
                      <div key={i} style={s.awardItem}>
                        <span style={s.awardIcon}>🏆</span>
                        <span style={s.awardText}>{aw.awardZh || aw.award}</span>
                        <span style={s.awardYear}>{aw.year}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* ── Tournament Tabs ── */}
                {tournaments.length > 0 && (
                  <>
                    <div style={s.sectionTitle}>赛事详情</div>
                    <div className="playersheet-tabs" style={s.tabsRow}>
                      {tournaments.map((t, i) => (
                        <button
                          key={t.year || i}
                          onClick={() => setActiveTab(i)}
                          style={s.tab(i === activeTab)}
                        >
                          {t.host || ""} {t.year}
                        </button>
                      ))}
                    </div>

                    {/* Active Tournament Detail */}
                    {activeTournament && (
                      <div style={s.tournamentCard}>
                        {/* Tournament header */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8,
                          marginBottom: 10,
                        }}>
                          <span style={{ fontSize: 16 }}>
                            {activeTournament.host || "🏟️"}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                            {activeTournament.year} 世界杯
                          </span>
                          {activeTournament.teamZh && (
                            <span style={{ fontSize: 12, marginLeft: "auto", color: "var(--text2)" }}>
                              {activeTournament.teamZh}
                            </span>
                          )}
                        </div>

                        {/* Stats rows */}
                        <div style={s.statRow}>
                          <span style={s.statLabel}>出场 (首发/替补)</span>
                          <span style={s.statValue}>
                            {activeTournament.apps || 0}
                            <span style={{ fontWeight: 400, color: "var(--text3)", fontSize: 11 }}>
                              {" "}({activeTournament.starts || 0} 首发 / {(activeTournament.apps || 0) - (activeTournament.starts || 0)} 替补)
                            </span>
                          </span>
                        </div>
                        <div style={s.statRow}>
                          <span style={s.statLabel}>进球</span>
                          <span style={{ ...s.statValue, color: "var(--green, #22c55e)" }}>
                            {activeTournament.goals || 0}
                          </span>
                        </div>
                        <div style={s.statRow}>
                          <span style={s.statLabel}>乌龙球</span>
                          <span style={s.statValue}>
                            {activeTournament.ownGoals || 0}
                          </span>
                        </div>

                        {/* Goal details */}
                        {activeTournament.goalDetails && activeTournament.goalDetails.length > 0 && (
                          <>
                            <div style={{ ...s.sectionTitle, margin: "12px 0 4px" }}>
                              进球详情
                            </div>
                            {activeTournament.goalDetails.map((g, i) => (
                              <div key={i} style={s.goalItem}>
                                <span style={s.minute}>{g.minute}</span>
                                <span style={s.goalText}>
                                  vs {g.opponentZh || g.opponent}
                                </span>
                                {g.penalty && (
                                  <span style={s.goalBadge("penalty")}>点球</span>
                                )}
                                {g.ownGoal && (
                                  <span style={s.goalBadge("og")}>乌龙</span>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ── Penalty Shootout Record ── */}
                {penaltyRecord && penaltyRecord.taken > 0 && (
                  <>
                    <div style={s.sectionTitle}>点球大战</div>
                    <div style={s.penaltyBar}>
                      <span style={{ fontSize: 20 }}>🎯</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                          {penaltyRecord.taken} 次
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                          <span style={{ color: "var(--green, #22c55e)" }}>
                            罚中 {penaltyRecord.scored || 0}
                          </span>
                          {" · "}
                          <span style={{ color: "var(--red, #ef4444)" }}>
                            罚失 {(penaltyRecord.taken || 0) - (penaltyRecord.scored || 0)}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 800,
                        color: (penaltyRecord.scored / penaltyRecord.taken) >= 0.7
                          ? "var(--green, #22c55e)" : "var(--amber, #f59e0b)",
                      }}>
                        {Math.round((penaltyRecord.scored / penaltyRecord.taken) * 100)}%
                      </div>
                    </div>
                  </>
                )}

                {/* ── xG Placeholder ── */}
                <div style={{ ...s.xgPlaceholder, marginTop: 16 }}>
                  <div style={{ marginBottom: 6 }}><BarChart3 size={18} strokeWidth={1.5} color="var(--text3)" /></div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>
                    xG数据将在赛事开始后更新
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
