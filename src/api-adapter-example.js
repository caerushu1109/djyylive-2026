import {
  mapProviderPayload,
  mapSportMonksEvent,
  mapSportMonksStandings,
  mapSportMonksStats,
} from "./provider-mappers.js";
import { createMatchdayState } from "./matchday-adapter.js";

function labelSportMonksGroups(rows) {
  const rawKeys = [...new Set(rows.map((row) => row.group || ""))].filter(Boolean);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const relabel = new Map();

  rawKeys.forEach((key, index) => {
    const keepKey = /^[A-Z]$/.test(key) || /^Group\s+[A-Z]$/i.test(key);
    relabel.set(key, keepKey ? key.replace(/^Group\s+/i, "") : (alphabet[index] || `G${index + 1}`));
  });

  return rows.map((row) => ({
    ...row,
    group: relabel.get(row.group) || row.group || "A",
  }));
}

export function buildMatchdayStateFromSportMonks(payload) {
  const mapped = mapProviderPayload("sportmonks", payload);
  const normalizedStandings = labelSportMonksGroups(
    mapSportMonksStandings(mapped.standings || [])
  );

  const groupedStandings = Object.fromEntries(
    Object.entries(
      normalizedStandings.reduce((acc, row) => {
        const key = row.group || "A";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {})
    ).map(([key, rows]) => [
      key,
      rows.sort(
        (a, b) =>
          b.points - a.points ||
          b.goal_difference - a.goal_difference ||
          b.goals_for - a.goals_for ||
          a.team.localeCompare(b.team)
      ),
    ])
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
