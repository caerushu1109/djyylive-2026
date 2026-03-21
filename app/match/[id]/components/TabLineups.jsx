"use client";

import { useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";

const POS_ZH = { GK: "\u95e8\u5c06", DF: "\u540e\u536b", MF: "\u4e2d\u573a", FW: "\u524d\u950b" };

function PlayerRow({ player, isHome, onPlayerClick }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
      flexDirection: isHome ? "row" : "row-reverse",
      cursor: onPlayerClick ? "pointer" : "default",
    }} onClick={() => onPlayerClick?.(player.name)}>
      <span style={{
        fontSize: 11, fontWeight: 800, color: "var(--text3)",
        width: 22, textAlign: "center", fontVariantNumeric: "tabular-nums",
      }}>{player.number}</span>
      <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 600 }}>
        {player.name}
      </span>
      <span style={{
        fontSize: 9, color: "var(--text3)", fontWeight: 600,
        background: "var(--card2)", padding: "1px 5px", borderRadius: 3,
      }}>
        {POS_ZH[player.position] || player.position}
      </span>
    </div>
  );
}

export default function TabLineups({ data }) {
  const { lineups, fixture } = data;
  const openPlayer = useOpenPlayer();
  const { lookup } = usePlayerIndex();
  const handlePlayerClick = (name) => {
    const id = lookup(name);
    if (id) openPlayer(id, name);
  };
  if (!lineups) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        {fixture.status === "NS" ? "\u6bd4\u8d5b\u5c1a\u672a\u5f00\u59cb\uff0c\u9884\u8ba1\u8d5b\u524d1\u5c0f\u65f6\u516c\u5e03\u9996\u53d1" : "\u6682\u65e0\u9635\u5bb9\u6570\u636e"}
      </div>
    );
  }

  const { home, away } = lineups;

  return (
    <div style={{ padding: "12px" }}>
      {/* Formations */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--card)", borderRadius: 10, padding: "12px 16px",
        border: "1px solid var(--border)", marginBottom: 12,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 2 }}>
            {fixture.home.flag} {fixture.home.name}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--blue)" }}>
            {home?.formation || "\u2014"}
          </div>
          {home?.coach && (
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
              \ud83e\uddd1\u200d\ud83d\udcbc {home.coach}
            </div>
          )}
        </div>
        <div style={{
          fontSize: 9, color: "var(--text3)", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          \u9635\u578b
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 2 }}>
            {fixture.away.name} {fixture.away.flag}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--red)" }}>
            {away?.formation || "\u2014"}
          </div>
          {away?.coach && (
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
              \ud83e\uddd1\u200d\ud83d\udcbc {away.coach}
            </div>
          )}
        </div>
      </div>

      {/* Starting XI side-by-side */}
      <div style={{
        background: "var(--card)", borderRadius: 10,
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "var(--text3)",
          padding: "8px 12px 6px", textTransform: "uppercase", letterSpacing: "0.06em",
          borderBottom: "1px solid var(--border)",
        }}>
          \u9996\u53d1\u9635\u5bb9
        </div>
        <div style={{ display: "flex" }}>
          {/* Home XI */}
          <div style={{ flex: 1, padding: "6px 12px", borderRight: "1px solid var(--border)" }}>
            {(home?.starting || []).map((p, i) => (
              <PlayerRow key={i} player={p} isHome={true} onPlayerClick={handlePlayerClick} />
            ))}
          </div>
          {/* Away XI */}
          <div style={{ flex: 1, padding: "6px 12px" }}>
            {(away?.starting || []).map((p, i) => (
              <PlayerRow key={i} player={p} isHome={false} onPlayerClick={handlePlayerClick} />
            ))}
          </div>
        </div>
      </div>

      {/* Bench */}
      {((home?.bench?.length > 0) || (away?.bench?.length > 0)) && (
        <div style={{
          background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border)", overflow: "hidden", marginTop: 10,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "var(--text3)",
            padding: "8px 12px 6px", textTransform: "uppercase", letterSpacing: "0.06em",
            borderBottom: "1px solid var(--border)",
          }}>
            \u66ff\u8865\u5e2d
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, padding: "6px 12px", borderRight: "1px solid var(--border)" }}>
              {(home?.bench || []).map((p, i) => (
                <PlayerRow key={i} player={p} isHome={true} onPlayerClick={handlePlayerClick} />
              ))}
            </div>
            <div style={{ flex: 1, padding: "6px 12px" }}>
              {(away?.bench || []).map((p, i) => (
                <PlayerRow key={i} player={p} isHome={false} onPlayerClick={handlePlayerClick} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{ height: 12 }} />
    </div>
  );
}
