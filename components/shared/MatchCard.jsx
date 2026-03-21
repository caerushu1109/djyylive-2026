"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTeamStrengths, findTeamStrength } from "@/lib/hooks/useTeamStrengths";
import { computeMatchOdds, computeLambda, eloToLambda, hybridLambda, getHostAdvantage } from "@/lib/poisson";

export default function MatchCard({ fixture, onClick, predictions, showVenue = false }) {
  const router = useRouter();
  const { data: strengthsData } = useTeamStrengths();

  if (!fixture) return null;
  const { id, home, away, homeScore, awayScore, status, minute, kickoff, group, venue } = fixture;
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

  // Poisson model probabilities (same as match detail page)
  const poissonResult = useMemo(() => {
    if (status !== "NS") return null;

    const homePred = predictions?.find(t => t.name === home.name || t.code === home.code);
    const awayPred = predictions?.find(t => t.name === away.name || t.code === away.code);

    const homeStr = findTeamStrength(strengthsData, home.originalName);
    const awayStr = findTeamStrength(strengthsData, away.originalName);

    const { homeBoost, awayBoost } = getHostAdvantage(
      home.originalName, away.originalName, venue
    );

    // Tier 1: Hybrid (strength + ELO)
    if (homeStr && awayStr && homePred?.elo && awayPred?.elo) {
      const lambdas = hybridLambda(
        homeStr.attack, homeStr.defense,
        awayStr.attack, awayStr.defense,
        homePred.elo, awayPred.elo,
        { avgGoals: 3.0, homeBoost, awayBoost }
      );
      return computeMatchOdds(lambdas.home, lambdas.away).result;
    }

    // Tier 2: Strength only
    if (homeStr && awayStr) {
      const lambdas = computeLambda(
        homeStr.attack, homeStr.defense,
        awayStr.attack, awayStr.defense,
        { avgGoals: 3.0, homeBoost, awayBoost }
      );
      return computeMatchOdds(lambdas.home, lambdas.away).result;
    }

    // Tier 3: ELO only (conservative defaults)
    if (homePred?.elo && awayPred?.elo) {
      const lambdas = eloToLambda(homePred.elo, awayPred.elo);
      lambdas.home *= homeBoost;
      lambdas.away *= awayBoost;
      return computeMatchOdds(lambdas.home, lambdas.away).result;
    }

    return null;
  }, [status, home, away, venue, predictions, strengthsData]);

  const showPred = status === "NS" && poissonResult;
  const homeWinPct = poissonResult?.homeWin;
  const drawPct = poissonResult?.draw;
  const awayWinPct = poissonResult?.awayWin;

  const inner = (
    <div style={{
      background: "var(--card)",
      border: `1px solid ${borderColor}`,
      borderRadius: "var(--radius)",
      margin: "0 12px 8px",
      overflow: "hidden",
    }}>
      {/* Main row */}
      <div style={{
        padding: "11px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        {group && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: "var(--text3)",
            background: "var(--card2)", padding: "2px 5px", borderRadius: 4,
            flexShrink: 0, letterSpacing: "0.02em",
          }}>{group}</span>
        )}

        {/* Home */}
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

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 60 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
            {status === "NS" ? "vs" : `${homeScore ?? 0}–${awayScore ?? 0}`}
          </div>
          {status === "FT" && (
            <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700, background: "var(--card2)", padding: "2px 5px", borderRadius: 4 }}>FT</div>
          )}
          {status === "LIVE" && (
            <div style={{ fontSize: 9, color: "var(--live)", fontWeight: 700, background: "var(--red-dim)", padding: "2px 5px", borderRadius: 4 }}>{minute || "LIVE"}</div>
          )}
          {status === "NS" && (
            <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>{kickoff || "—"}</div>
          )}
        </div>

        {/* Away */}
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

      {/* Footer: prediction bar + venue */}
      {(showVenue || showPred) && (
        <div style={{ padding: "0 12px 8px", display: "flex", flexDirection: "column", gap: 5 }}>
          {showPred && (
            <div>
              <div style={{ display: "flex", height: 4, borderRadius: 3, overflow: "hidden", gap: 1 }}>
                <div style={{ flex: homeWinPct, background: "var(--blue)", borderRadius: "3px 0 0 3px" }} />
                <div style={{ flex: drawPct, background: "var(--text3)" }} />
                <div style={{ flex: awayWinPct, background: "#e05252", borderRadius: "0 3px 3px 0" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 9, color: "var(--blue)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  胜 {homeWinPct}%
                </span>
                <span style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600 }}>
                  平 {drawPct}%
                </span>
                <span style={{ fontSize: 9, color: "#e05252", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  胜 {awayWinPct}%
                </span>
              </div>
            </div>
          )}
          {showVenue && venue && (
            <div style={{ fontSize: 9, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
              <span>📍</span>
              <span>{venue}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) return <div onClick={() => onClick(fixture)}>{inner}</div>;
  return <Link href={`/match/${id}`} style={{ display: "block" }}>{inner}</Link>;
}
