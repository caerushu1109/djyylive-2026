"use client";
import Link from "next/link";

function LiveDot() {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7,
      borderRadius: "50%", background: "var(--live)",
      animation: "ringpulse 1.5s infinite",
      flexShrink: 0,
    }} />
  );
}

function ScoreCenter({ status, homeScore, awayScore, minute, kickoff }) {
  if (status === "LIVE") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 64, flexShrink: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
          {homeScore ?? 0}–{awayScore ?? 0}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
          <LiveDot />
          <span style={{ fontSize: 9, color: "var(--live)", fontWeight: 700 }}>{minute || "LIVE"}</span>
        </div>
      </div>
    );
  }
  if (status === "FT") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 64, flexShrink: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
          {homeScore ?? 0}–{awayScore ?? 0}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", background: "var(--card2)", padding: "2px 5px", borderRadius: 4, marginTop: 2 }}>
          终场
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 64, flexShrink: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dim)" }}>{kickoff || "--:--"}</div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>今日</div>
    </div>
  );
}

export default function MatchCard({ fixture, onClick }) {
  if (!fixture) return null;
  const { id, home, away, homeScore, awayScore, stage, venue, status, minute, kickoff } = fixture;
  if (!home || !away) return null;

  const homeWins = status === "FT" && homeScore > awayScore;
  const awayWins = status === "FT" && awayScore > homeScore;

  const inner = (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      margin: "0 12px 8px",
      padding: "10px 12px",
      cursor: "pointer",
    }}>
      {stage && (
        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          {stage}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Home */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{home.flag || "🏴"}</span>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: homeWins ? "var(--text)" : awayWins ? "var(--text-dim)" : "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{home.name}</span>
        </div>
        {/* Score */}
        <ScoreCenter status={status} homeScore={homeScore} awayScore={awayScore} minute={minute} kickoff={kickoff} />
        {/* Away */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", flexDirection: "row-reverse", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{away.flag || "🏴"}</span>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: awayWins ? "var(--text)" : homeWins ? "var(--text-dim)" : "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right",
          }}>{away.name}</span>
        </div>
      </div>
      {venue && (
        <div style={{ marginTop: 6, fontSize: 9, color: "var(--text-muted)" }}>📍 {venue}</div>
      )}
    </div>
  );

  if (onClick) return <div onClick={() => onClick(fixture)}>{inner}</div>;
  return <Link href={`/match/${id}`} style={{ display: "block" }}>{inner}</Link>;
}
