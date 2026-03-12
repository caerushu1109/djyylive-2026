import {
  mapProviderPayload,
  mapSportMonksEvent,
  mapSportMonksStandings,
  mapSportMonksStats,
} from "./provider-mappers.js";
import { createMatchdayState } from "./matchday-adapter.js";

export function buildMatchdayStateFromSportMonks(payload) {
  const mapped = mapProviderPayload("sportmonks", payload);

  const groupedStandings = Object.fromEntries(
    Object.entries(
      mapped.standings.reduce((acc, row) => {
        const normalized = mapSportMonksStandings([row])[0];
        const key = normalized.group || "A";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(normalized);
        return acc;
      }, {})
    )
  );

  const detailsByMatch = Object.fromEntries(
    Object.entries(mapped.eventsByMatch).map(([matchId, events]) => [
      matchId,
      {
        timeline: (events || []).map(mapSportMonksEvent),
        stats: mapSportMonksStats(mapped.statsByMatch[matchId] || {}),
      },
    ])
  );

  return createMatchdayState({
    matches: mapped.matches,
    groups: groupedStandings,
    detailsByMatch,
  });
}

export function buildMatchdayStateFromSportMonksApiSamples({ match, standingsRows = [] }) {
  return buildMatchdayStateFromSportMonks({
    match,
    standingsRows,
  });
}
