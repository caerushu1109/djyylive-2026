"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTopScorers } from "@/lib/hooks/useTopScorers";
import { useTopAssists } from "@/lib/hooks/useTopAssists";
import TopBar from "@/components/shared/TopBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getTeamMeta } from "@/src/lib/team-meta";
import { PlayerProvider, useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";

const TABS = [
  { id: "goals", label: "⚽ 射手榜" },
  { id: "assists", label: "👟 助攻榜" },
];

function PlayerRow({ player, index, total, mode, onPlayerClick }) {
  const meta = player.teamMeta || getTeamMeta(player.team || "");
  const isTop3 = index < 3;
  const mainStat = mode === "goals" ? player.goals : player.assists;
  const subStat = mode === "goals" ? player.assists : player.goals;

  return (
    <div style={{
      display: "flex", alignItems: "center", padding: "10px 12px",
      borderBottom: index < total - 1 ? "1px solid var(--border)" : "none",
    }}>
      <span style={{
        width: 28, textAlign: "center", fontSize: 12,
        fontWeight: 800, fontVariantNumeric: "tabular-nums",
        color: isTop3 ? "var(--blue)" : "var(--text3)",
      }}>
        {isTop3 ? ["🥇", "🥈", "🥉"][index] : index + 1}
      </span>
      <div
        style={{ flex: 1, minWidth: 0, cursor: onPlayerClick ? "pointer" : "default" }}
        onClick={() => onPlayerClick?.(player.player)}
      >
        <div style={{
          fontSize: 12, fontWeight: 700, color: "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {player.player}
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
          <span>{meta.flag}</span>
          <span>{meta.shortName}</span>
        </div>
      </div>
      <span style={{
        width: 36, textAlign: "center", fontSize: 11,
        color: "var(--text2)", fontVariantNumeric: "tabular-nums",
      }}>{player.matches}</span>
      <span style={{
        width: 36, textAlign: "center", fontSize: 14,
        fontWeight: 900, color: "var(--text)",
        fontVariantNumeric: "tabular-nums",
      }}>{mainStat}</span>
      <span style={{
        width: 36, textAlign: "center", fontSize: 11,
        color: "var(--text2)", fontVariantNumeric: "tabular-nums",
      }}>{subStat}</span>
      <span style={{
        width: 44, textAlign: "center", fontSize: 10,
        color: "var(--text3)", fontVariantNumeric: "tabular-nums",
      }}>{player.minutes}&apos;</span>
    </div>
  );
}

function TableHeader({ mode }) {
  const mainLabel = mode === "goals" ? "进球" : "助攻";
  const subLabel = mode === "goals" ? "助攻" : "进球";
  return (
    <div style={{
      display: "flex", alignItems: "center", padding: "8px 12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--card2)",
    }}>
      <span style={{ width: 28, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>#</span>
      <span style={{ flex: 1, fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>球员</span>
      <span style={{ width: 36, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>场</span>
      <span style={{ width: 36, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>{mainLabel}</span>
      <span style={{ width: 36, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>{subLabel}</span>
      <span style={{ width: 44, fontSize: 9, color: "var(--text3)", fontWeight: 700, textAlign: "center" }}>分钟</span>
    </div>
  );
}

export default function ScorersClient() {
  return (
    <PlayerProvider>
      <ScorersInner />
    </PlayerProvider>
  );
}

function ScorersInner() {
  const { comp } = useParams();
  const [activeTab, setActiveTab] = useState("goals");
  const { data: scorersData, loading: scorersLoading } = useTopScorers();
  const { data: assistsData, loading: assistsLoading } = useTopAssists();
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();

  const loading = activeTab === "goals" ? scorersLoading : assistsLoading;
  const players = activeTab === "goals"
    ? (scorersData?.scorers || [])
    : (assistsData?.assists || []);

  const handlePlayerClick = (name) => {
    const id = lookup(name);
    if (id) openPlayer(id, name);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar comp={comp} badge />

      {/* Tab switcher */}
      <div style={{
        display: "flex", padding: "0 12px", gap: 0,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        position: "sticky", top: 52, zIndex: 40,
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 700,
              color: t.id === activeTab ? "var(--blue)" : "var(--text3)",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottom: t.id === activeTab ? "2px solid var(--blue)" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "12px 12px 0" }}>
        {loading ? (
          <LoadingSpinner />
        ) : players.length === 0 ? (
          <div style={{
            padding: "40px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13,
          }}>
            {activeTab === "goals" ? "暂无射手数据（开赛后更新）" : "暂无助攻数据（开赛后更新）"}
          </div>
        ) : (
          <div style={{
            background: "var(--card)", borderRadius: 10,
            border: "1px solid var(--border)", overflow: "hidden",
          }}>
            <TableHeader mode={activeTab} />
            {players.map((s, i) => (
              <PlayerRow key={i} player={s} index={i} total={players.length} mode={activeTab} onPlayerClick={handlePlayerClick} />
            ))}
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
