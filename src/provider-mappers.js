import { coerceStatus, inferPhase } from "./matchday-normalizers.js";

function scoreLine(homeScore, awayScore) {
  if (homeScore == null || awayScore == null) {
    return "vs";
  }
  return `${homeScore}:${awayScore}`;
}

function toNumber(value, fallback = 0) {
  if (value == null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSportMonksStateToken(rawMatch) {
  return (
    rawMatch.state?.developer_name ||
    rawMatch.state?.state ||
    rawMatch.state?.short_name ||
    rawMatch.status ||
    rawMatch.state_id ||
    rawMatch.state
  );
}

function reduceStandingDetails(details) {
  if (!Array.isArray(details)) {
    return details || {};
  }

  return details.reduce((acc, item) => {
    const key =
      item.type?.code ||
      item.type?.developer_name?.toLowerCase?.() ||
      item.type?.name?.toLowerCase?.() ||
      item.key;
    const value = item.value ?? item.data?.value ?? item.score ?? item.points ?? 0;
    if (key) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function getStandingMetric(details, keys, fallback = 0) {
  for (const key of keys) {
    if (details[key] != null) {
      return toNumber(details[key], fallback);
    }
  }
  return fallback;
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function aggregateStatsBySide(rows = []) {
  return rows.reduce(
    (acc, row) => {
      const side = row.location === "away" ? "away" : "home";
      const code =
        row.type?.code ||
        row.type?.developer_name?.toLowerCase?.() ||
        row.type?.name?.toLowerCase?.();
      const value = row.data?.value ?? row.value;
      if (!code) {
        return acc;
      }
      acc[side][code] = value;
      return acc;
    },
    { home: {}, away: {} }
  );
}

export function mapSportMonksMatch(rawMatch) {
  const participants = rawMatch.participants || rawMatch.teams || [];
  const homeSide = participants.find((item) => item.meta?.location === "home" || item.location === "home") || {};
  const awaySide = participants.find((item) => item.meta?.location === "away" || item.location === "away") || {};
  const stateToken = getSportMonksStateToken(rawMatch);
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
    status: coerceStatus(stateToken),
    phase: inferPhase(stateToken, rawMatch.starting_at),
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
  return rows.map((row) => {
    const details = reduceStandingDetails(row.details);
    const goalsFor = getStandingMetric(details, ["goals-for", "goals_for", "gf"], row.goals_for || row.gf || 0);
    const goalsAgainst = getStandingMetric(details, ["goals-against", "goals_against", "ga"], row.goals_against || row.ga || 0);

    return {
      group: row.group?.name || row.group_name || row.stage?.name || String(row.stage_id || ""),
      team: row.participant?.name || row.team_name || row.team || "",
      played: getStandingMetric(details, ["played", "matches-played", "games-played"], row.played || 0),
      win: getStandingMetric(details, ["won", "wins"], row.win || row.wins || 0),
      draw: getStandingMetric(details, ["draw", "drawn", "draws"], row.draw || row.draws || 0),
      loss: getStandingMetric(details, ["lost", "loss", "losses"], row.loss || row.losses || 0),
      points: toNumber(row.points, 0),
      goals_for: goalsFor,
      goals_against: goalsAgainst,
      goal_difference:
        row.goal_difference ??
        getStandingMetric(details, ["goal-difference", "goal_difference", "gd"], null) ??
        (goalsFor - goalsAgainst),
    };
  });
}

export function mapSportMonksEvent(rawEvent) {
  const type = (rawEvent.type?.developer_name || rawEvent.type?.code || rawEvent.type || "context").toLowerCase();
  return {
    event_id: String(rawEvent.id || rawEvent.event_id || ""),
    minute: rawEvent.minute ?? rawEvent.time?.minute ?? 0,
    stoppage_minute: rawEvent.added_time ?? rawEvent.time?.stoppage ?? null,
    type,
    team: rawEvent.participant?.name || rawEvent.team_name || rawEvent.team || "",
    player: rawEvent.player_name || rawEvent.player?.display_name || rawEvent.player?.name || "",
    related_player:
      rawEvent.related_player_name ||
      rawEvent.related_player?.display_name ||
      rawEvent.related_player?.name ||
      "",
    result: rawEvent.result || "",
    info: rawEvent.info || "",
    addition: rawEvent.addition || "",
    detail: rawEvent.detail || rawEvent.info || rawEvent.addition || rawEvent.type?.name || "",
  };
}

export function mapSportMonksStats(rawStats = {}) {
  if (Array.isArray(rawStats)) {
    const grouped = aggregateStatsBySide(rawStats);
    return {
      possession_home: toNumber(grouped.home["ball-possession"], 50),
      possession_away: toNumber(grouped.away["ball-possession"], 50),
      shots_home: toNumber(grouped.home["shots-total"], 0),
      shots_away: toNumber(grouped.away["shots-total"], 0),
      shots_on_target_home: toNumber(grouped.home["shots-on-target"], 0),
      shots_on_target_away: toNumber(grouped.away["shots-on-target"], 0),
      corners_home: toNumber(grouped.home.corners, 0),
      corners_away: toNumber(grouped.away.corners, 0),
      yellowcards_home: toNumber(grouped.home.yellowcards, 0),
      yellowcards_away: toNumber(grouped.away.yellowcards, 0),
      xg_home: toNumber(grouped.home["expected-goals"], 0),
      xg_away: toNumber(grouped.away["expected-goals"], 0),
    };
  }

  return {
    possession_home: rawStats.possession_home ?? rawStats.possession?.home ?? 50,
    possession_away: rawStats.possession_away ?? rawStats.possession?.away ?? 50,
    shots_home: rawStats.shots_home ?? rawStats.shots?.home ?? 0,
    shots_away: rawStats.shots_away ?? rawStats.shots?.away ?? 0,
    shots_on_target_home: rawStats.shots_on_target_home ?? rawStats.shots_on_target?.home ?? 0,
    shots_on_target_away: rawStats.shots_on_target_away ?? rawStats.shots_on_target?.away ?? 0,
    corners_home: rawStats.corners_home ?? rawStats.corners?.home ?? 0,
    corners_away: rawStats.corners_away ?? rawStats.corners?.away ?? 0,
    yellowcards_home: rawStats.yellowcards_home ?? rawStats.yellowcards?.home ?? 0,
    yellowcards_away: rawStats.yellowcards_away ?? rawStats.yellowcards?.away ?? 0,
    xg_home: rawStats.xg_home ?? rawStats.xg?.home ?? 0,
    xg_away: rawStats.xg_away ?? rawStats.xg?.away ?? 0,
  };
}

export function mapProviderPayload(provider, payload) {
  if (provider === "sportmonks") {
    const matchRows = [
      ...toArray(payload.matches),
      ...toArray(payload.fixtures),
      ...toArray(payload.fixture),
      ...toArray(payload.match),
    ];
    const standingsRows = payload.standings || payload.standingsRows || [];
    const eventsByMatch =
      payload.eventsByMatch ||
      Object.fromEntries(
        matchRows
          .filter((match) => Array.isArray(match.events))
          .map((match) => [String(match.id), match.events])
      );
    const statsByMatch =
      payload.statsByMatch ||
      Object.fromEntries(
        matchRows
          .filter((match) => Array.isArray(match.statistics))
          .map((match) => [String(match.id), match.statistics])
      );

    return {
      matches: matchRows.map(mapSportMonksMatch),
      standings: standingsRows,
      eventsByMatch,
      statsByMatch,
    };
  }
  return {
    matches: payload.matches || [],
    standings: payload.standings || [],
    eventsByMatch: payload.eventsByMatch || {},
    statsByMatch: payload.statsByMatch || {},
  };
}
