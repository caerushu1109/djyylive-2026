"use client";

import { useMemo } from "react";
import { POSITION_LABEL } from "@/lib/canonical-names";
import { useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";

const POSITION_ORDER = ["GK", "DF", "MF", "FW"];

const POSITION_COLOR = {
  GK: "var(--amber, #f59e0b)",
  DF: "var(--blue, #5c9eff)",
  MF: "var(--green, #22c55e)",
  FW: "var(--red, #ef4444)",
};

export default function TabSquad({ squadData, teamDetail }) {
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();

  if (!squadData?.players?.length) return (
    <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>暂无阵容数据</p>
  );

  const { players } = squadData;
  const byPosition = {};
  for (const pos of POSITION_ORDER) byPosition[pos] = [];
  for (const p of players) {
    if (byPosition[p.position]) byPosition[p.position].push(p);
    else byPosition["FW"] = [...(byPosition["FW"] || []), p];
  }

  // Build top players lookup from teamDetail
  const topPlayersMap = useMemo(() => {
    const map = {};
    if (teamDetail?.topPlayers) {
      for (const tp of teamDetail.topPlayers) {
        map[tp.name.toLowerCase()] = tp;
      }
    }
    return map;
  }, [teamDetail]);

  return (
    <div style={{ padding: "12px 16px 20px" }}>
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", overflow: "hidden",
      }}>
        {POSITION_ORDER.filter(pos => byPosition[pos]?.length > 0).map((pos, pi) => (
          <div key={pos}>
            <div style={{
              padding: "6px 12px",
              fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
              color: "var(--text-dim)", background: "var(--card2)",
              borderTop: pi > 0 ? "1px solid var(--border)" : "none",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: POSITION_COLOR[pos],
              }} />
              {POSITION_LABEL[pos]}（{byPosition[pos].length}人）
            </div>
            {byPosition[pos].map((p, i) => {
              const playerKey = p.name?.toLowerCase();
              const wcStats = topPlayersMap[playerKey];
              const hasEnrichedData = p.image || p.nameZh || p.club;
              return (
                <div key={p.id} onClick={() => {
                  const histId = lookup(p.name);
                  openPlayer(String(p.id), p.nameZh || p.name, histId);
                }} style={{
                  display: "flex", alignItems: "center", padding: hasEnrichedData ? "8px 12px" : "7px 12px", gap: 10,
                  borderBottom: i < byPosition[pos].length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer",
                }}>
                  {/* Player photo or number */}
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        objectFit: "cover", background: "var(--card2)",
                        border: `2px solid ${POSITION_COLOR[pos] || "var(--border)"}`,
                        flexShrink: 0,
                      }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "var(--text-dim)",
                      width: 32, height: 32, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--card2)", border: `2px solid ${POSITION_COLOR[pos] || "var(--border)"}`,
                      fontVariantNumeric: "tabular-nums", flexShrink: 0,
                    }}>
                      {p.shirtNumber ?? "—"}
                    </span>
                  )}
                  {/* Name + details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {p.shirtNumber != null && p.image && (
                        <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700 }}>#{p.shirtNumber}</span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.nameZh || p.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 1, flexWrap: "wrap" }}>
                      {p.nameZh && p.name && (
                        <span style={{ fontSize: 10, color: "var(--text3)" }}>{p.name}</span>
                      )}
                      {p.age && (
                        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{p.age}岁</span>
                      )}
                      {p.height && (
                        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{p.height}cm</span>
                      )}
                      {p.club && (
                        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{p.club}</span>
                      )}
                    </div>
                  </div>
                  {/* WC stats badge */}
                  {wcStats && (
                    <span style={{
                      fontSize: 10, color: "var(--text-dim)",
                      background: "var(--card2)", borderRadius: 4, padding: "2px 6px",
                      fontVariantNumeric: "tabular-nums", flexShrink: 0,
                    }}>
                      WC: {wcStats.apps}场 {wcStats.goals}球
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", marginTop: 8 }}>
        共 {players.length} 人
      </div>
    </div>
  );
}
