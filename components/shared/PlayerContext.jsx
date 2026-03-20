"use client";
import { createContext, useContext, useState, useCallback } from "react";
import PlayerSheet from "./PlayerSheet";

const PlayerCtx = createContext(null);

/**
 * Wrap a page with <PlayerProvider> to enable player profile sheets.
 * Any child can call openPlayer(playerId, playerName) to open the sheet.
 */
export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null); // { id, historicalId, name }

  const openPlayer = useCallback((id, name, historicalId) => {
    if (id) setPlayer({ id, name: name || "", historicalId: historicalId || null });
  }, []);

  const closePlayer = useCallback(() => setPlayer(null), []);

  return (
    <PlayerCtx.Provider value={openPlayer}>
      {children}
      {player && (
        <PlayerSheet
          playerId={player.id}
          historicalId={player.historicalId}
          playerName={player.name}
          onClose={closePlayer}
        />
      )}
    </PlayerCtx.Provider>
  );
}

export function useOpenPlayer() {
  return useContext(PlayerCtx);
}

/**
 * Inline clickable player name span.
 * Usage: <PlayerName id="P-12345" name="Lionel Messi">梅西</PlayerName>
 */
export function PlayerName({ id, name, children, style }) {
  const openPlayer = useContext(PlayerCtx);

  if (!openPlayer || !id) {
    return <span style={style}>{children}</span>;
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        openPlayer(id, name || (typeof children === "string" ? children : ""));
      }}
      style={{
        ...style,
        cursor: "pointer",
        textDecoration: "underline",
        textDecorationColor: "var(--text3)",
        textUnderlineOffset: 2,
        textDecorationThickness: 1,
      }}
    >
      {children}
    </span>
  );
}
