import { coerceStatus, inferPhase } from "./matchday-normalizers.js";

function scoreLine(homeScore, awayScore) {
  if (homeScore == null || awayScore == null) {
    return "vs";
  }
  return `${homeScore}:${awayScore}`;
}

export function mapSportMonksMatch(rawMatch) {
  const participants = rawMatch.participants || rawMatch.teams || [];
  const homeSide = participants.find((item) => item.meta?.location === "home" || item.location === "home") || {};
  const awaySide = participants.find((item) => item.meta?.location === "away" || item.location === "away") || {};
  const homeScore =
    rawMatch.scores?.find?.((item) => item.description === "CURRENT" && item.score?.participant === "home")?.score?.goals ??
    rawMatch.home_score ??
    null;
  const awayScore =
    rawMatch.scores?.find?.((item) => item.description === "CURRENT" && item.score?.participant === "away")?.score?.goals ??
    rawMatch.away_score ??
    null;
  const venue = rawMatch.venue?.name || rawMatch.venue_name || "";
  const city = rawMatch.venue?.city_name || rawMatch.city || venue;
  const country = rawMatch.venue?.country_name || rawMatch.country || "";

  return {
    id: String(rawMatch.id),
    status: coerceStatus(rawMatch.state_id || rawMatch.status || rawMatch.state),
    phase: inferPhase(rawMatch.state_id || rawMatch.status || rawMatch.state, rawMatch.starting_at),
    stage: rawMatch.round?.name || rawMatch.stage || rawMatch.group?.name || "",
    stage_order: rawMatch.round?.sort_order || 999,
    group: rawMatch.group?.name || null,
    kickoff: rawMatch.starting_at || rawMatch.kickoff || "",
    home: homeSide.name || rawMatch.home_name || rawMatch.home || "",
    away: awaySide.name || rawMatch.away_name || rawMatch.away || "",
    home_score: homeScore,
    away_score: awayScore,
    score: scoreLine(homeScore, awayScore),
    minute: rawMatch.time?.minute ? `${rawMatch.time.minute}'` : rawMatch.minute || "",
    venue,
    city,
    country,
    meta: rawMatch.name || rawMatch.note || "",
    source: "sportmonks",
  };
}

export function mapSportMonksStandings(rows = []) {
  return rows.map((row) => ({
    group: row.group?.name || row.group_name || "",
    team: row.participant?.name || row.team_name || row.team || "",
    played: row.details?.played || row.played || 0,
    win: row.details?.won || row.win || row.wins || 0,
    draw: row.details?.draw || row.draw || row.draws || 0,
    loss: row.details?.lost || row.loss || row.losses || 0,
    points: row.points || 0,
    goals_for: row.details?.goals_for || row.goals_for || row.gf || 0,
    goals_against: row.details?.goals_against || row.goals_against || row.ga || 0,
    goal_difference:
      row.goal_difference ??
      ((row.details?.goals_for || row.goals_for || row.gf || 0) -
        (row.details?.goals_against || row.goals_against || row.ga || 0)),
  }));
}

export function mapSportMonksEvent(rawEvent) {
  return {
    event_id: String(rawEvent.id || rawEvent.event_id || ""),
    minute: rawEvent.minute ?? rawEvent.time?.minute ?? 0,
    stoppage_minute: rawEvent.added_time ?? rawEvent.time?.stoppage ?? null,
    type: rawEvent.type?.developer_name || rawEvent.type || "context",
    team: rawEvent.participant?.name || rawEvent.team_name || rawEvent.team || "",
    player: rawEvent.player_name || rawEvent.player?.display_name || rawEvent.player?.name || "",
    detail: rawEvent.detail || rawEvent.info || rawEvent.type?.name || "",
  };
}

export function mapSportMonksStats(rawStats = {}) {
  return {
    possession_home: rawStats.possession_home ?? rawStats.possession?.home ?? 50,
    possession_away: rawStats.possession_away ?? rawStats.possession?.away ?? 50,
    shots_home: rawStats.shots_home ?? rawStats.shots?.home ?? 0,
    shots_away: rawStats.shots_away ?? rawStats.shots?.away ?? 0,
    shots_on_target_home: rawStats.shots_on_target_home ?? rawStats.shots_on_target?.home ?? 0,
    shots_on_target_away: rawStats.shots_on_target_away ?? rawStats.shots_on_target?.away ?? 0,
    xg_home: rawStats.xg_home ?? rawStats.xg?.home ?? 0,
    xg_away: rawStats.xg_away ?? rawStats.xg?.away ?? 0,
  };
}

export function mapProviderPayload(provider, payload) {
  if (provider === "sportmonks") {
    return {
      matches: (payload.matches || []).map(mapSportMonksMatch),
      standings: payload.standings || [],
      eventsByMatch: payload.eventsByMatch || {},
      statsByMatch: payload.statsByMatch || {},
    };
  }
  return {
    matches: payload.matches || [],
    standings: payload.standings || [],
    eventsByMatch: payload.eventsByMatch || {},
    statsByMatch: payload.statsByMatch || {},
  };
}
