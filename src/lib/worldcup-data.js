import { getCityLabel, getTeamMeta } from "@/src/lib/team-meta";
import sampleProviderData from "@/data/provider-samples/sportmonks-worldcup-sample.json";

const CURRENT_SCORE = "CURRENT";
const WORLD_CUP_START = "2026-06-11";
const WORLD_CUP_END = "2026-07-19";

let sampleCache = null;
const finishedFixtureCache = new Map();
const finishedMatchDetailCache = new Map();

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeState(stateValue) {
  const value = String(
    typeof stateValue === "string"
      ? stateValue
      : stateValue?.state || stateValue?.short_name || stateValue?.developer_name || ""
  ).toLowerCase();

  if (["live", "inplay", "ht"].includes(value)) {
    return "LIVE";
  }
  if (["ft", "finished", "after_penalties"].includes(value)) {
    return "FT";
  }
  return "NS";
}

function findParticipant(participants, location) {
  return (
    toArray(participants).find((item) => item?.meta?.location === location) ||
    toArray(participants)[location === "home" ? 0 : 1] ||
    {}
  );
}

function scoreForParticipant(scores, location) {
  const current = toArray(scores).find(
    (item) =>
      String(item?.description || "").toUpperCase() === CURRENT_SCORE &&
      item?.score?.participant === location
  );
  return typeof current?.score?.goals === "number" ? current.score.goals : null;
}

function formatMinute(match) {
  const liveMinute = match?.time?.minute;
  if (typeof liveMinute === "number") {
    return `${liveMinute}'`;
  }
  const kickoff = normalizeKickoffValue(match?.starting_at);
  if (!kickoff) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(new Date(kickoff));
}

function stageLabel(match) {
  const groupName = String(match?.group?.name || "").replace(/^Group\s+/i, "");
  const group = groupName ? `${groupName}组` : "";
  const roundRaw = String(match?.round?.name || "").trim();
  // If round name already contains the group (e.g. "A组"), skip the group prefix
  if (roundRaw.includes("组") || roundRaw.includes("Group")) {
    return roundRaw;
  }
  const round = /^\d+$/.test(roundRaw) ? `第${roundRaw}轮` : roundRaw;
  return [group, round].filter(Boolean).join(" ");
}

function venueLabel(match) {
  return getCityLabel(match?.venue?.city_name) || match?.venue?.name || "";
}

export function normalizeFixture(match) {
  const homeParticipant = findParticipant(match?.participants, "home");
  const awayParticipant = findParticipant(match?.participants, "away");
  const homeName = homeParticipant?.name || null;
  const awayName = awayParticipant?.name || null;
  const homeMeta = getTeamMeta(homeName || "Home");
  const awayMeta = getTeamMeta(awayName || "Away");
  const status = normalizeState(match?.state);
  return {
    id: String(match?.id || ""),
    stage: stageLabel(match),
    group: match?.group?.name ? String(match.group.name).replace(/^Group\s+/i, "") + " 组" : match?.round?.name || "世界杯",
    status,
    minute: formatMinute(match),
    kickoff: formatMinute(match),
    home: {
      flag: homeName ? homeMeta.flag : "🏴",
      name: homeName ? homeMeta.shortName : "待定",
      originalName: homeName || "",
      elo: null,
      isTbd: !homeName,
    },
    away: {
      flag: awayName ? awayMeta.flag : "🏴",
      name: awayName ? awayMeta.shortName : "待定",
      originalName: awayName || "",
      elo: null,
      isTbd: !awayName,
    },
    homeScore: scoreForParticipant(match?.scores, "home"),
    awayScore: scoreForParticipant(match?.scores, "away"),
    venue: venueLabel(match),
    isLive: status === "LIVE",
    startingAt: normalizeKickoffValue(match?.starting_at),
    rawState: match?.state || null,
    seasonId: match?.season_id || null,
  };
}

function normalizeKickoffValue(value) {
  if (!value) {
    return null;
  }
  const raw = String(value).trim();
  return raw.includes("T") ? raw : raw.replace(" ", "T") + "Z";
}

function sortFixtures(fixtures) {
  return [...fixtures].sort((left, right) => {
    const leftTime = new Date(left.startingAt || 0).getTime();
    const rightTime = new Date(right.startingAt || 0).getTime();
    return leftTime - rightTime;
  });
}

function groupOrderValue(label) {
  const value = String(label || "").trim();
  const groupMatch = value.match(/^([A-Z])\s*组$/);
  if (groupMatch) {
    return groupMatch[1].charCodeAt(0) - 65;
  }
  return 99;
}

function compareGroupLabels(left, right) {
  const leftOrder = groupOrderValue(left);
  const rightOrder = groupOrderValue(right);
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }
  return String(left || "").localeCompare(String(right || ""), "zh-CN");
}

function groupFixtures(fixtures) {
  const groups = new Map();
  sortFixtures(fixtures).forEach((fixture) => {
    const key = fixture.group || "其他";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(fixture);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => compareGroupLabels(left, right))
    .map(([label, matches]) => ({
      label,
      matches,
    }));
}

function normalizeStandingRow(row) {
  const meta = getTeamMeta(row?.participant?.name || "Team");
  const details = Object.fromEntries(
    toArray(row?.details).map((detail) => [detail?.type?.developer_name || detail?.type_id, detail?.value])
  );

  return {
    group: row?.group?.name ? `${String(row.group.name).replace(/^Group\s+/i, "")} 组` : "世界杯",
    flag: meta.flag,
    name: meta.shortName,
    originalName: row?.participant?.name || meta.shortName,
    p: Number(details.OVERALL_MATCHES ?? 0),
    w: Number(details.OVERALL_WINS ?? 0),
    d: Number(details.OVERALL_DRAWS ?? 0),
    l: Number(details.OVERALL_LOST ?? 0),
    gf: Number(details.OVERALL_SCORED ?? 0),
    ga: Number(details.OVERALL_CONCEDED ?? 0),
    gd: Number(details.OVERALL_GOAL_DIFFERENCE ?? 0),
    pts: Number(details.TOTAL_POINTS ?? row?.points ?? 0),
  };
}

function normalizeStandings(rows) {
  const groups = new Map();

  rows.map(normalizeStandingRow).forEach((row) => {
    if (!groups.has(row.group)) {
      groups.set(row.group, []);
    }
    groups.get(row.group).push(row);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => compareGroupLabels(left, right))
    .map(([group, list]) => {
      const sorted = [...list].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
      return {
        group,
        rows: sorted.map((row, index) => ({
          ...row,
          pos: index + 1,
          tone: index === 0 ? "q1" : index === 1 ? "q2" : index === sorted.length - 1 ? "out danger" : "out",
        })),
      };
    });
}

function freezeFinishedFixtures(fixtures) {
  return fixtures.map((fixture) => {
    const cacheKey = String(fixture.id);
    if (fixture.status === "FT") {
      if (!finishedFixtureCache.has(cacheKey)) {
        finishedFixtureCache.set(cacheKey, fixture);
      }
      return finishedFixtureCache.get(cacheKey);
    }
    return fixture;
  });
}

function freezeFinishedMatchDetail(detailPayload) {
  const fixtureId = String(detailPayload?.fixture?.id || "");
  if (!fixtureId) {
    return detailPayload;
  }
  if (detailPayload?.fixture?.status === "FT") {
    if (!finishedMatchDetailCache.has(fixtureId)) {
      finishedMatchDetailCache.set(fixtureId, detailPayload);
    }
    return finishedMatchDetailCache.get(fixtureId);
  }
  return detailPayload;
}

function iconForEvent(typeName) {
  const value = String(typeName || "").toLowerCase();
  if (value.includes("goal")) {
    return "⚽";
  }
  if (value.includes("yellow")) {
    return "🟨";
  }
  if (value.includes("red")) {
    return "🟥";
  }
  if (value.includes("sub")) {
    return "🔄";
  }
  return "•";
}

function makePair(label, homeVal, awayVal, suffix = "") {
  const left = Number(homeVal ?? 0);
  const right = Number(awayVal ?? 0);
  const total = left + right;
  const leftWidth = total ? Math.round((left / total) * 100) : 50;
  return {
    label,
    left: `${left}${suffix}`,
    right: `${right}${suffix}`,
    leftWidth,
    rightWidth: 100 - leftWidth,
  };
}

function buildAllStats(stats) {
  return [
    makePair("控球率", stats.possession?.home, stats.possession?.away, "%"),
    makePair("射门", stats.shots?.home, stats.shots?.away),
    makePair("射正", stats.shots_on_target?.home, stats.shots_on_target?.away),
    makePair("射偏", stats.shots_off_target?.home, stats.shots_off_target?.away),
    makePair("被封堵", stats.blocked_shots?.home, stats.blocked_shots?.away),
    makePair("xG", stats.xg?.home, stats.xg?.away),
    makePair("角球", stats.corner_kicks?.home, stats.corner_kicks?.away),
    makePair("犯规", stats.fouls?.home, stats.fouls?.away),
    makePair("越位", stats.offsides?.home, stats.offsides?.away),
    makePair("黄牌", stats.yellow_cards?.home, stats.yellow_cards?.away),
    makePair("红牌", stats.red_cards?.home, stats.red_cards?.away),
    makePair("扑救", stats.saves?.home, stats.saves?.away),
    makePair("传球", stats.passes?.home, stats.passes?.away),
    makePair("传球准确率", stats.pass_accuracy?.home, stats.pass_accuracy?.away, "%"),
    makePair("铲球", stats.tackles?.home, stats.tackles?.away),
    makePair("拦截", stats.interceptions?.home, stats.interceptions?.away),
  ].filter((s) => {
    const l = parseFloat(s.left);
    const r = parseFloat(s.right);
    return l > 0 || r > 0;
  });
}

function buildLineups(lineupsRaw) {
  if (!lineupsRaw) return null;
  const buildSide = (side) => {
    if (!side) return null;
    return {
      formation: side.formation || null,
      coach: side.coach || null,
      starting: toArray(side.starting).map((p) => ({
        number: p.number ?? null,
        name: p.name || "",
        position: p.position || "",
      })),
      bench: toArray(side.bench).map((p) => ({
        number: p.number ?? null,
        name: p.name || "",
        position: p.position || "",
      })),
    };
  };
  return { home: buildSide(lineupsRaw.home), away: buildSide(lineupsRaw.away) };
}

function buildDetailFromSample(sample, fixtureId) {
  const fixture = toArray(sample.matches).find((item) => String(item.id) === String(fixtureId));
  if (!fixture) {
    return null;
  }

  const normalizedFixture = normalizeFixture(fixture);
  const stats = sample.statsByMatch?.[String(fixtureId)] || {};

  const events = toArray(sample.eventsByMatch?.[String(fixtureId)]).map((event) => ({
    minute: event.minute,
    minuteLabel: `${event.minute}'`,
    icon: iconForEvent(event?.type?.developer_name),
    type: event?.type?.developer_name || "",
    title: event?.player?.name || event?.type?.name || "事件",
    subtitle: event?.detail || "",
    team: event?.participant?.name || "",
    teamMeta: getTeamMeta(event?.participant?.name || ""),
    assist: event?.assist || null,
  }));

  const lineups = buildLineups(sample.lineupsByMatch?.[String(fixtureId)]);
  const odds = sample.oddsByMatch?.[String(fixtureId)] || null;
  const predictions = sample.predictionsByMatch?.[String(fixtureId)] || null;

  return {
    fixture: normalizedFixture,
    stats: buildAllStats(stats),
    events,
    lineups,
    odds,
    predictions,
    teams: {
      home: normalizedFixture.home.originalName,
      away: normalizedFixture.away.originalName,
    },
  };
}

async function readSample() {
  if (sampleCache) {
    return sampleCache;
  }
  sampleCache = sampleProviderData;
  return sampleCache;
}

async function fetchSportMonksJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`SportMonks ${response.status}: ${message.slice(0, 200)}`);
  }

  return response.json();
}

function buildSportMonksUrl(pathname, params = {}) {
  const baseUrl = (process.env.SPORTMONKS_BASE_URL || "https://api.sportmonks.com/v3/football").replace(/\/$/, "");
  const url = new URL(`${baseUrl}/${pathname.replace(/^\//, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set("api_token", process.env.SPORTMONKS_API_TOKEN || "");
  if (!url.searchParams.has("locale")) {
    url.searchParams.set("locale", "zh");
  }
  return url.toString();
}

async function fetchSportMonksFixtures() {
  const from = WORLD_CUP_START;
  const to = WORLD_CUP_END;
  const include = "participants;scores;state;venue;round;group";
  // Paginate: WC2026 has 104 fixtures, SportMonks default page is 25
  let allMatches = [];
  let page = 1;
  while (page <= 5) {
    const fixturesUrl = buildSportMonksUrl(`fixtures/between/${from}/${to}`, {
      include, per_page: 100, page,
    });
    const fixtureResponse = await fetchSportMonksJson(fixturesUrl);
    const pageMatches = toArray(fixtureResponse?.data);
    allMatches = allMatches.concat(pageMatches);
    if (!fixtureResponse?.pagination?.has_more || pageMatches.length === 0) break;
    page++;
  }
  const matches = allMatches;
  if (!matches.length) {
    throw new Error(`No World Cup fixtures returned for ${from} - ${to}`);
  }

  let standingsRows = [];
  const seasonId = matches[0]?.season_id;
  if (seasonId) {
    const standingsUrl = buildSportMonksUrl(`standings/seasons/${seasonId}`, {
      include: "participant;details.type;group",
    });
    const standingsResponse = await fetchSportMonksJson(standingsUrl);
    standingsRows = toArray(standingsResponse?.data);
  }

  return {
    source: "sportmonks",
    fixtures: freezeFinishedFixtures(sortFixtures(matches.map(normalizeFixture))),
    standings: normalizeStandings(standingsRows),
    updatedAt: new Date().toISOString(),
  };
}

export async function getFixturesData(options = {}) {
  const forceSample = options.mode === "drill";
  let fallbackReason = null;

  if (!forceSample && process.env.SPORTMONKS_API_TOKEN) {
    try {
      const sportMonksData = await fetchSportMonksFixtures();
      return {
        ...sportMonksData,
        groupedFixtures: groupFixtures(sportMonksData.fixtures),
        liveCount: sportMonksData.fixtures.filter((fixture) => fixture.status === "LIVE").length,
        mode: "live",
      };
    } catch (error) {
      fallbackReason = error instanceof Error ? error.message : String(error);
      console.warn("Falling back to sample SportMonks data:", error);
    }
  } else if (forceSample) {
    fallbackReason = "Drill mode enabled";
  } else {
    fallbackReason = "SPORTMONKS_API_TOKEN is not available at runtime";
  }

  const sample = await readSample();
  const fixtures = freezeFinishedFixtures(sortFixtures(toArray(sample.matches).map(normalizeFixture)));
  const standings = normalizeStandings(toArray(sample.standings));

  return {
    source: "sample",
    fixtures,
    groupedFixtures: groupFixtures(fixtures),
    standings,
    liveCount: fixtures.filter((fixture) => fixture.status === "LIVE").length,
    updatedAt: new Date().toISOString(),
    mode: forceSample ? "drill" : "sample",
    diagnostics: {
      hasToken: Boolean(process.env.SPORTMONKS_API_TOKEN),
      baseUrl: process.env.SPORTMONKS_BASE_URL || "https://api.sportmonks.com/v3/football",
      fallbackReason,
    },
  };
}

export async function getMatchDetail(fixtureId, options = {}) {
  const forceSample = options.mode === "drill";

  if (!forceSample && process.env.SPORTMONKS_API_TOKEN) {
    try {
      const include = "participants;scores;state;venue;round;group;events.type;statistics.type;lineups.details.type;formations";
      const fixtureUrl = buildSportMonksUrl(`fixtures/${fixtureId}`, { include });
      const response = await fetchSportMonksJson(fixtureUrl);
      const fixture = response?.data;
      if (fixture) {
        const normalizedFixture = normalizeFixture(fixture);
        const homeId = findParticipant(fixture?.participants, "home")?.id;
        const statsByTeam = {};

        toArray(fixture.statistics).forEach((item) => {
          const side = item?.participant_id === homeId ? "home" : "away";
          const key = item?.type?.developer_name;
          if (!key) return;
          if (!statsByTeam[key]) statsByTeam[key] = { home: 0, away: 0 };
          statsByTeam[key][side] = Number(item?.data?.value ?? item?.value ?? 0);
        });

        // Map SportMonks stat keys to our internal sample-like keys
        const statMap = {
          possession: statsByTeam.BALL_POSSESSION,
          shots: statsByTeam.SHOTS_TOTAL,
          shots_on_target: statsByTeam.SHOTS_ON_TARGET,
          shots_off_target: statsByTeam.SHOTS_OFF_TARGET,
          blocked_shots: statsByTeam.BLOCKED_SHOTS,
          corner_kicks: statsByTeam.CORNER_KICKS,
          fouls: statsByTeam.FOULS,
          offsides: statsByTeam.OFFSIDES,
          yellow_cards: statsByTeam.YELLOWCARDS,
          red_cards: statsByTeam.REDCARDS,
          saves: statsByTeam.SAVES,
          passes: statsByTeam.PASSES,
          pass_accuracy: statsByTeam.PASSES_PERCENTAGE,
          tackles: statsByTeam.TACKLES,
          interceptions: statsByTeam.INTERCEPTIONS,
          xg: statsByTeam.EXPECTED_GOALS,
        };

        // Build lineups from SportMonks response
        let lineups = null;
        const lineupData = toArray(fixture.lineups);
        if (lineupData.length > 0) {
          const buildSide = (side) => {
            const players = lineupData.filter((p) =>
              side === "home" ? p.team_id === homeId : p.team_id !== homeId
            );
            const starting = players.filter((p) => p.type === "lineup");
            const bench = players.filter((p) => p.type === "bench");
            const formation = toArray(fixture.formations).find((f) =>
              side === "home" ? f.participant_id === homeId : f.participant_id !== homeId
            );
            return {
              formation: formation?.formation || null,
              coach: null,
              starting: starting.map((p) => ({
                number: p.jersey_number ?? null,
                name: p.player_name || p.player?.name || "",
                position: p.position?.developer_name || p.position || "",
              })),
              bench: bench.map((p) => ({
                number: p.jersey_number ?? null,
                name: p.player_name || p.player?.name || "",
                position: p.position?.developer_name || p.position || "",
              })),
            };
          };
          lineups = { home: buildSide("home"), away: buildSide("away") };
        }

        // Fetch odds separately (different endpoint)
        let odds = null;
        try {
          const oddsUrl = buildSportMonksUrl(`odds/pre-match/fixtures/${fixtureId}`, {
            include: "bookmaker",
          });
          const oddsResponse = await fetchSportMonksJson(oddsUrl);
          const oddsData = toArray(oddsResponse?.data);
          if (oddsData.length > 0) {
            // Group by market: find 1X2 (fulltime result), Asian Handicap, Over/Under
            const ftResult = oddsData.filter((o) => o.market_id === 1); // 1X2
            const ah = oddsData.find((o) => o.market_id === 28); // Asian Handicap
            const ou = oddsData.find((o) => o.market_id === 18); // Over/Under 2.5
            odds = {
              "1X2": ftResult.slice(0, 5).map((o) => ({
                bookmaker: o.bookmaker?.name || "Unknown",
                home: Number(o.value) || 0,
                draw: 0,
                away: 0,
              })),
              asian_handicap: ah ? { bookmaker: ah.bookmaker?.name || "", line: Number(ah.handicap ?? 0), home: 0, away: 0 } : null,
              over_under: ou ? { bookmaker: ou.bookmaker?.name || "", line: 2.5, over: 0, under: 0 } : null,
            };
          }
        } catch (_) { /* odds not available yet */ }

        // Fetch predictions separately
        let predictions = null;
        try {
          const predUrl = buildSportMonksUrl(`predictions/probabilities/fixtures/${fixtureId}`);
          const predResponse = await fetchSportMonksJson(predUrl);
          const predData = toArray(predResponse?.data);
          if (predData.length > 0) {
            const find = (type) => predData.find((p) => p.type_id === type)?.predictions;
            const ftProb = find(1); // fulltime result
            predictions = {
              home_win: ftProb?.home ?? null,
              draw: ftProb?.draw ?? null,
              away_win: ftProb?.away ?? null,
              btts_yes: null,
              over_2_5: null,
              correct_score: null,
            };
          }
        } catch (_) { /* predictions not available yet */ }

        return freezeFinishedMatchDetail({
          fixture: normalizedFixture,
          stats: buildAllStats(statMap),
          events: toArray(fixture.events).map((event) => ({
            minute: event.minute || 0,
            minuteLabel: `${event.minute || 0}'`,
            icon: iconForEvent(event?.type?.developer_name),
            type: event?.type?.developer_name || "",
            title: event?.player_name || event?.player?.name || event?.type?.name || "事件",
            subtitle: event?.result || "",
            team: event?.participant?.name || "",
            teamMeta: getTeamMeta(event?.participant?.name || ""),
            assist: null,
          })),
          lineups,
          odds,
          predictions,
          teams: {
            home: normalizedFixture.home.originalName,
            away: normalizedFixture.away.originalName,
          },
        });
      }
    } catch (error) {
      console.warn("Falling back to sample match detail:", error);
    }
  }

  const sample = await readSample();
  return {
    ...freezeFinishedMatchDetail(buildDetailFromSample(sample, fixtureId)),
    mode: forceSample ? "drill" : "sample",
  };
}

export async function getTopScorers(options = {}) {
  const forceSample = options.mode === "drill";

  if (!forceSample && process.env.SPORTMONKS_API_TOKEN) {
    try {
      // First get seasonId from any fixture
      const fixturesUrl = buildSportMonksUrl(`fixtures/between/${WORLD_CUP_START}/${WORLD_CUP_END}`, {
        per_page: 1,
      });
      const fixturesResponse = await fetchSportMonksJson(fixturesUrl);
      const seasonId = toArray(fixturesResponse?.data)?.[0]?.season_id;
      if (seasonId) {
        const url = buildSportMonksUrl(`topscorers/seasons/${seasonId}`, {
          include: "participant;player",
        });
        const response = await fetchSportMonksJson(url);
        const rows = toArray(response?.data);
        if (rows.length > 0) {
          return {
            source: "sportmonks",
            scorers: rows.map((row) => {
              const meta = getTeamMeta(row.participant?.name || "");
              return {
                player: row.player?.name || row.player_name || "",
                team: meta.shortName,
                flag: meta.flag,
                teamMeta: meta,
                goals: Number(row.total ?? row.goals ?? 0),
                assists: Number(row.assists ?? 0),
                matches: Number(row.appearances ?? 0),
                minutes: Number(row.minutes_played ?? 0),
              };
            }),
          };
        }
      }
    } catch (error) {
      console.warn("Falling back to sample top scorers:", error);
    }
  }

  const sample = await readSample();
  return {
    source: "sample",
    scorers: toArray(sample.topScorers).map((row) => {
      const meta = getTeamMeta(row.team || "");
      return {
        ...row,
        team: meta.shortName,
        flag: meta.flag,
        teamMeta: meta,
      };
    }),
    mode: forceSample ? "drill" : "sample",
  };
}

export async function getTopAssists(options = {}) {
  const forceSample = options.mode === "drill";

  if (!forceSample && process.env.SPORTMONKS_API_TOKEN) {
    try {
      const fixturesUrl = buildSportMonksUrl(`fixtures/between/${WORLD_CUP_START}/${WORLD_CUP_END}`, {
        per_page: 1,
      });
      const fixturesResponse = await fetchSportMonksJson(fixturesUrl);
      const seasonId = toArray(fixturesResponse?.data)?.[0]?.season_id;
      if (seasonId) {
        const url = buildSportMonksUrl(`topscorers/seasons/${seasonId}`, {
          include: "participant;player",
          type: "assists",
        });
        const response = await fetchSportMonksJson(url);
        const rows = toArray(response?.data);
        if (rows.length > 0) {
          return {
            source: "sportmonks",
            assists: rows.map((row) => {
              const meta = getTeamMeta(row.participant?.name || "");
              return {
                player: row.player?.name || row.player_name || "",
                team: meta.shortName,
                flag: meta.flag,
                teamMeta: meta,
                assists: Number(row.total ?? row.assists ?? 0),
                goals: Number(row.goals ?? 0),
                matches: Number(row.appearances ?? 0),
                minutes: Number(row.minutes_played ?? 0),
              };
            }),
          };
        }
      }
    } catch (error) {
      console.warn("Falling back to sample top assists:", error);
    }
  }

  // Fallback: derive from top scorers sample sorted by assists
  const sample = await readSample();
  const scorers = toArray(sample.topScorers)
    .filter((row) => Number(row.assists ?? 0) > 0)
    .sort((a, b) => Number(b.assists ?? 0) - Number(a.assists ?? 0));
  return {
    source: "sample",
    assists: scorers.map((row) => {
      const meta = getTeamMeta(row.team || "");
      return { ...row, team: meta.shortName, flag: meta.flag, teamMeta: meta };
    }),
    mode: forceSample ? "drill" : "sample",
  };
}
