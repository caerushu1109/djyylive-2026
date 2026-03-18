"use client";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

function LiveDot() {
  return (
    <span style={{
      display: "inline-block", width: 6, height: 6,
      borderRadius: "50%", background: "var(--live)",
      marginRight: 4, animation: "livepulse 1.2s ease-in-out infinite",
    }} />
  );
}

function TeamRow({ flag, name, score, winner }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
    }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>{flag}</span>
      <span style={{
        flex: 1, fontSize: 14, fontWeight: winner ? 700 : 400,
        color: winner ? "var(--text)" : "var(--text-dim)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {name}
      </span>
      <span style={{
        fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: "right",
        color: winner ? "var(--text)" : "var(--text-dim)",
      }}>
        {score !== null && score !== undefined ? score : ""}
      </span>
    </div>
  );
}

function StatusBadge({ fixture }) {
  if (fixture.status === "LIVE") {
    return (
      <Badge tone="live">
        <LiveDot />{fixture.minute || "LIVE"}
      </Badge>
    );
  }
  if (fixture.status === "FT") return <Badge tone="ft">终</Badge>;
  return <Badge tone="ns">{fixture.kickoff}</Badge>;
}

export default function MatchCard({ fixture, onClick }) {
  if (!fixture) return null;
  const { id, home, away, homeScore, awayScore, stage, venue, status } = fixture;
  const homeWins = status === "FT" && homeScore > awayScore;
  const awayWins = status === "FT" && awayScore > homeScore;

  const inner = (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "12px 14px",
      cursor: "pointer",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{stage}</span>
        <StatusBadge fixture={fixture} />
      </div>
      <TeamRow flag={home.flag} name={home.name} score={homeScore} winner={homeWins} />
      <TeamRow flag={away.flag} name={away.name} score={awayScore} winner={awayWins} />
      {venue && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--text-dim)", opacity: 0.7 }}>
          📍 {venue}
        </p>
      )}
    </div>
  );

  if (onClick) return <div onClick={() => onClick(fixture)}>{inner}</div>;
  return <Link href={`/match/${id}`} style={{ display: "block" }}>{inner}</Link>;
}
