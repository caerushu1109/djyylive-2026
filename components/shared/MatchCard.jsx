"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MatchCard({ fixture, onClick }) {
  const router = useRouter();
  if (!fixture) return null;
  const { id, home, away, homeScore, awayScore, status, minute, kickoff, group } = fixture;
  if (!home || !away) return null;

  const goTeam = (e, team) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/team/${encodeURIComponent(team.originalName || team.name)}`);
  };

  const homeWins = status === "FT" && homeScore > awayScore;
  const awayWins = status === "FT" && awayScore > homeScore;

  const borderColor = status === "LIVE" ? "rgba(255,61,61,0.3)" : "var(--border)";
  const scoreColor = status === "LIVE" ? "var(--live)" : "var(--text)";

  const inner = (
    <div style={{
      background: "var(--card)",
      border: `1px solid ${borderColor}`,
      borderRadius: "var(--radius)",
      margin: "0 12px 8px",
      padding: "11px 12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      {/* Group badge */}
      {group && (
        <span style={{
          fontSize: 9, fontWeight: 700, color: "var(--text3)",
          background: "var(--card2)", padding: "2px 5px", borderRadius: 4,
          flexShrink: 0, letterSpacing: "0.02em",
        }}>{group}</span>
      )}

      {/* Home team block */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{home.flag || "🏴"}</div>
        <div onClick={(e) => goTeam(e, home)} style={{
          fontSize: 12, fontWeight: 700,
          color: homeWins ? "var(--text)" : awayWins ? "var(--text2)" : "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          cursor: "pointer",
        }}>
          {home.name}
        </div>
      </div>

      {/* Score center */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 60 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
          {status === "NS" ? "vs" : `${homeScore ?? 0}–${awayScore ?? 0}`}
        </div>
        {status === "FT" && (
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700, background: "var(--card2)", padding: "2px 5px", borderRadius: 4 }}>
            FT
          </div>
        )}
        {status === "LIVE" && (
          <div style={{ fontSize: 9, color: "var(--live)", fontWeight: 700, background: "var(--red-dim)", padding: "2px 5px", borderRadius: 4 }}>
            {minute || "LIVE"}
          </div>
        )}
        {status === "NS" && (
          <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>
            {kickoff || "—"}
          </div>
        )}
      </div>

      {/* Away team block */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", flexDirection: "row-reverse", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{away.flag || "🏴"}</div>
        <div onClick={(e) => goTeam(e, away)} style={{
          fontSize: 12, fontWeight: 700,
          color: awayWins ? "var(--text)" : homeWins ? "var(--text2)" : "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right",
          cursor: "pointer",
        }}>
          {away.name}
        </div>
      </div>
    </div>
  );

  if (onClick) return <div onClick={() => onClick(fixture)}>{inner}</div>;
  return <Link href={`/match/${id}`} style={{ display: "block" }}>{inner}</Link>;
}
