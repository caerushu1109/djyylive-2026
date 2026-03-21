"use client";

import { useState } from "react";
import { useOpenPlayer } from "@/components/shared/PlayerContext";
import { usePlayerIndex } from "@/lib/hooks/usePlayerIndex";
import TeamLogo from "@/components/shared/TeamLogo";

const POS_ZH = { GK: "门将", DF: "后卫", MF: "中场", FW: "前锋" };

function PlayerAvatar({ image, number, size = 28 }) {
  const [imgError, setImgError] = useState(false);

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          background: "var(--card2)",
        }}
      />
    );
  }

  // Fallback: shirt number in circle
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--card2)", display: "flex",
      alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: size * 0.4, fontWeight: 800, color: "var(--text3)",
        fontVariantNumeric: "tabular-nums",
      }}>{number ?? ""}</span>
    </div>
  );
}

function RatingBadge({ rating }) {
  if (!rating || rating <= 0) return null;
  const r = Number(rating).toFixed(1);
  const color =
    rating >= 8.0 ? "#2ecc71" :
    rating >= 7.0 ? "#5c9eff" :
    rating >= 6.0 ? "var(--text2)" :
    "#e05252";
  const bg =
    rating >= 8.0 ? "rgba(46,204,113,0.12)" :
    rating >= 7.0 ? "rgba(92,158,255,0.12)" :
    rating >= 6.0 ? "var(--card2)" :
    "rgba(224,82,82,0.12)";

  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color, background: bg,
      padding: "2px 5px", borderRadius: 4,
      fontVariantNumeric: "tabular-nums", marginLeft: "auto", flexShrink: 0,
    }}>
      {r}
    </span>
  );
}

function PlayerRow({ player, isHome, onPlayerClick, showImage = true }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "5px 0",
      flexDirection: isHome ? "row" : "row-reverse",
      cursor: onPlayerClick ? "pointer" : "default",
    }} onClick={() => onPlayerClick?.(player.name)}>
      {showImage && (
        <PlayerAvatar image={player.image} number={player.number} size={28} />
      )}
      {!showImage && (
        <span style={{
          fontSize: 11, fontWeight: 800, color: "var(--text3)",
          width: 22, textAlign: "center", fontVariantNumeric: "tabular-nums",
        }}>{player.number}</span>
      )}
      <span style={{
        fontSize: 11, color: "var(--text)", fontWeight: 600,
        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        textAlign: isHome ? "left" : "right",
      }}>
        {player.name}
      </span>
      <span style={{
        fontSize: 9, color: "var(--text3)", fontWeight: 600,
        background: "var(--card2)", padding: "1px 5px", borderRadius: 3,
      }}>
        {POS_ZH[player.position] || player.position}
      </span>
      <RatingBadge rating={player.rating} />
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
        {fixture.status === "NS" ? "比赛尚未开始，预计赛前1小时公布首发" : "暂无阵容数据"}
      </div>
    );
  }

  const { home, away } = lineups;

  // Check if any player has an image (to decide display mode)
  const hasImages = [...(home?.starting || []), ...(away?.starting || [])].some((p) => p.image);
  // Check if any player has a rating
  const hasRatings = [...(home?.starting || []), ...(away?.starting || [])].some((p) => p.rating);

  // Find MVP (highest rated player)
  const allPlayers = [...(home?.starting || []), ...(away?.starting || [])];
  const mvp = hasRatings
    ? allPlayers.reduce((best, p) => (p.rating && (!best || p.rating > best.rating) ? p : best), null)
    : null;

  return (
    <div style={{ padding: "12px" }}>
      {/* MVP highlight */}
      {mvp && mvp.rating >= 7.0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "linear-gradient(135deg, rgba(46,204,113,0.08), rgba(92,158,255,0.08))",
          border: "1px solid rgba(46,204,113,0.2)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
        }}>
          <PlayerAvatar image={mvp.image} number={mvp.number} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700, letterSpacing: "0.06em" }}>
              {"⭐"} MVP
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
              {mvp.name}
            </div>
          </div>
          <RatingBadge rating={mvp.rating} />
        </div>
      )}

      {/* Formations */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--card)", borderRadius: 10, padding: "12px 16px",
        border: "1px solid var(--border)", marginBottom: 12,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginBottom: 2 }}>
            <TeamLogo logo={fixture.home.logo} flag={fixture.home.flag} size={16} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>{fixture.home.name}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--blue)" }}>
            {home?.formation || "—"}
          </div>
          {home?.coach && (
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
              {"🧑‍💼"} {home.coach}
            </div>
          )}
        </div>
        <div style={{
          fontSize: 9, color: "var(--text3)", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          {"阵型"}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>{fixture.away.name}</span>
            <TeamLogo logo={fixture.away.logo} flag={fixture.away.flag} size={16} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--red)" }}>
            {away?.formation || "—"}
          </div>
          {away?.coach && (
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
              {"🧑‍💼"} {away.coach}
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
          display: "flex", justifyContent: "space-between",
        }}>
          <span>{"首发阵容"}</span>
          {hasRatings && <span style={{ fontSize: 9 }}>{"评分"}</span>}
        </div>
        <div style={{ display: "flex" }}>
          {/* Home XI */}
          <div style={{ flex: 1, padding: "6px 10px", borderRight: "1px solid var(--border)" }}>
            {(home?.starting || []).map((p, i) => (
              <PlayerRow key={i} player={p} isHome={true} onPlayerClick={handlePlayerClick} showImage={hasImages} />
            ))}
          </div>
          {/* Away XI */}
          <div style={{ flex: 1, padding: "6px 10px" }}>
            {(away?.starting || []).map((p, i) => (
              <PlayerRow key={i} player={p} isHome={false} onPlayerClick={handlePlayerClick} showImage={hasImages} />
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
            {"替补席"}
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, padding: "6px 10px", borderRight: "1px solid var(--border)" }}>
              {(home?.bench || []).map((p, i) => (
                <PlayerRow key={i} player={p} isHome={true} onPlayerClick={handlePlayerClick} showImage={hasImages} />
              ))}
            </div>
            <div style={{ flex: 1, padding: "6px 10px" }}>
              {(away?.bench || []).map((p, i) => (
                <PlayerRow key={i} player={p} isHome={false} onPlayerClick={handlePlayerClick} showImage={hasImages} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{ height: 12 }} />
    </div>
  );
}
