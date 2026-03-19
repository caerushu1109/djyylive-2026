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
  const round = /^\d+$/.test(roundRaw) ? `第${roundRaw}轮` : roundRaw;
  return [group, round].filter(Boolean).join(" ");
}

function venueLabel(match) {
  return getCityLabel(match?.venue?.city_name) || match?.venue?.name || "";
}

export function normalizeFixture(match) {
  const homeParticipant = findParticipant(match?.participants, "home");
  const awayParticipant = findParticipant(match?.participants, "away");
  const homeMeta = getTeamMeta(homeParticipant?.name || "Home");
  const awayMeta = getTeamMeta(awayParticipant?.name || "Away");
  const status = normalizeState(match?.state);

  return {
    id: String(match?.id || ""),
    stage: stageLabel(match),
    group: match?.group?.name
      ? String(match.group.name).replace(/^Group\s+/i, "") + " 组"
      : match?.round?.name || "世界杯",
    status,
    minute: formatMinute(match),
    kickoff: formatMinute(match),
    home: {
      flag: homeMeta.flag,
      name: homeMeta.shortName,
      originalName: homeParticipant?.name || homeMeta.shortName,
      elo: null,
    },
    away: {
      flag: awayMeta.flag,
      name: awayMeta.shortName,
      originalName: awayParticipant?.name || awayMeta.shortName,
      elo: null,
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

function buildDetailFromSample(sample, fixtureId) {
  const fixture = toArray(sample.matches).find((item) => String(item.id) === String(fixtureId));
  if (!fixture) {
    return null;
  }

  const normalizedFixture = normalizeFixture(fixture);
  const stats = sample.statsByMatch?.[String(fixtureId)] || {};
  const homeOriginalName = normalizedFixture.home.originalName;
  const awayOriginalName = normalizedFixture.away.originalName;

  const detailStats = [
    {
      label: "控球率",
      left: `${stats.possession?.home ?? 50}%`,
      right: `${stats.possession?.away ?? 50}%`,
      leftWidth: stats.possession?.home ?? 50,
      rightWidth: stats.possession?.away ?? 50,
    },
    {
      label: "射门",
      left: String(stats.shots?.home ?? 0),
      right: String(stats.shots?.away ?? 0),
      leftWidth: stats.shots?.home || stats.shots?.away ? Math.round(((stats.shots?.home ?? 0) / ((stats.shots?.home ?? 0) + (stats.shots?.away ?? 0))) * 100) : 50,
      rightWidth: stats.shots?.home || stats.shots?.away ? 100 - Math.round(((stats.shots?.home ?? 0) / ((stats.shots?.home ?? 0) + (stats.shots?.away ?? 0))) * 100) : 50,
    },
    {
      label: "射正",
      left: String(stats.shots_on_target?.home ?? 0),
      right: String(stats.shots_on_target?.away ?? 0),
      leftWidth:
        stats.shots_on_target?.home || stats.shots_on_target?.away
          ? Math.round(
              (((stats.shots_on_target?.home ?? 0) / ((stats.shots_on_target?.home ?? 0) + (stats.shots_on_target?.away ?? 0))) || 0.5) *
                100
            )
          : 50,
      rightWidth:
        stats.shots_on_target?.home || stats.shots_on_target?.away
          ? 100 -
            Math.round(
              (((stats.shots_on_target?.home ?? 0) / ((stats.shots_on_target?.home ?? 0) + (stats.shots_on_target?.away ?? 0))) || 0.5) *
                100
            )
          : 50,
    },
    {
      label: "xG",
      left: String(stats.xg?.home ?? 0),
      right: String(stats.xg?.away ?? 0),
      leftWidth:
        stats.xg?.home || stats.xg?.away
          ? Math.round((((stats.xg?.home ?? 0) / ((stats.xg?.home ?? 0) + (stats.xg?.away ?? 0))) || 0.5) * 100)
          : 50,
      rightWidth:
        stats.xg?.home || stats.xg?.away
          ? 100 - Math.round((((stats.xg?.home ?? 0) / ((stats.xg?.home ?? 0) + (stats.xg?.away ?? 0))) || 0.5) * 100)
          : 50,
    },
  ];

  const events = toArray(sample.eventsByMatch?.[String(fixtureId)]).map((event) => ({
    minute: `${event.minute}'`,
    icon: iconForEvent(event?.type?.developer_name),
    title: event?.player?.name || event?.type?.name || "事件",
    subtitle: `${getTeamMeta(event?.participant?.name || "").flag} ${getTeamMeta(event?.participant?.name || "").shortName} ${event?.detail || ""}`.trim(),
  }));

  return {
    fixture: normalizedFixture,
    stats: detailStats,
    events,
    probabilities: {
      home: 46,
      draw: 26,
      away: 28,
    },
    odds: [
      { label: "主胜", value: "2.10", implied: "47.6%" },
      { label: "平局", value: "3.40", implied: "29.4%" },
      { label: "客胜", value: "3.20", implied: "31.3%" },
    ],
    h2hSummary: [
      { value: 2, label: `${normalizedFixture.home.flag} ${normalizedFixture.home.name}胜`, tone: "blue" },
      { value: 1, label: "平局", tone: "gray" },
      { value: 1, label: `${normalizedFixture.away.flag} ${normalizedFixture.away.name}胜`, tone: "red" },
    ],
    h2hMatches: [
      { year: "2025", event: "热身赛", score: "2-1", tone: "blue" },
      { year: "2024", event: "洲际赛事", score: "1-1", tone: "dim" },
      { year: "2022", event: "国际比赛日", score: "0-1", tone: "red" },
    ],
    statGrid: [
      { value: String(stats.shots?.home ?? 0), label: `${normalizedFixture.home.flag}射门` },
      { value: String(stats.possession?.home ?? 0), label: `${normalizedFixture.home.flag}控球` },
      { value: String(stats.xg?.home ?? 0), label: `${normalizedFixture.home.flag} xG` },
      { value: String(stats.shots?.away ?? 0), label: `${normalizedFixture.away.flag}射门` },
      { value: String(stats.possession?.away ?? 0), label: `${normalizedFixture.away.flag}控球` },
      { value: String(stats.xg?.away ?? 0), label: `${normalizedFixture.away.flag} xG` },
    ],
    teams: {
      home: homeOriginalName,
      away: awayOriginalName,
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
  return url.toString();
}

async function fetchSportMonksFixtures() {
  const from = WORLD_CUP_START;
  const to = WORLD_CUP_END;
  const include = "participants;scores;state;venue;round;group";
  const fixturesUrl = buildSportMonksUrl(`fixtures/between/${from}/${to}`, { include });
  const fixtureResponse = await fetchSportMonksJson(fixturesUrl);
  const matches = toArray(fixtureResponse?.data);

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
      const include = "participants;scores;state;venue;round;group;events.type;statistics.type";
      const fixtureUrl = buildSportMonksUrl(`fixtures/${fixtureId}`, { include });
      const response = await fetchSportMonksJson(fixtureUrl);
      const fixture = response?.data;
      if (fixture) {
        const normalizedFixture = normalizeFixture(fixture);
        const statsByTeam = {};

        toArray(fixture.statistics).forEach((item) => {
          const side = item?.participant_id === findParticipant(fixture?.participants, "home")?.id ? "home" : "away";
          const key = item?.type?.developer_name;
          if (!key) {
            return;
          }
          if (!statsByTeam[key]) {
            statsByTeam[key] = { home: 0, away: 0 };
          }
          statsByTeam[key][side] = Number(item?.data?.value ?? item?.value ?? 0);
        });

        const pair = (label, key, suffix = "") => {
          const left = Number(statsByTeam[key]?.home ?? 0);
          const right = Number(statsByTeam[key]?.away ?? 0);
          const total = left + right;
          const leftWidth = total ? Math.round((left / total) * 100) : 50;
          return {
            label,
            left: `${left}${suffix}`,
            right: `${right}${suffix}`,
            leftWidth,
            rightWidth: 100 - leftWidth,
          };
        };

        return freezeFinishedMatchDetail({
          fixture: normalizedFixture,
          stats: [
            pair("控球率", "BALL_POSSESSION", "%"),
            pair("射门", "SHOTS_TOTAL"),
            pair("射正", "SHOTS_ON_TARGET"),
            pair("角球", "CORNER_KICKS"),
          ],
          events: toArray(fixture.events).map((event) => ({
            minute: `${event.minute || 0}'`,
            icon: iconForEvent(event?.type?.developer_name),
            title: event?.player_name || event?.player?.name || event?.type?.name || "事件",
            subtitle: `${getTeamMeta(event?.participant?.name || "").flag} ${getTeamMeta(event?.participant?.name || "").shortName}`.trim(),
          })),
          probabilities: {
            home: 46,
            draw: 26,
            away: 28,
          },
          odds: [
            { label: "主胜", value: "-", implied: "-" },
            { label: "平局", value: "-", implied: "-" },
            { label: "客胜", value: "-", implied: "-" },
          ],
          h2hSummary: [
            { value: 0, label: `${normalizedFixture.home.flag} ${normalizedFixture.home.name}胜`, tone: "blue" },
            { value: 0, label: "平局", tone: "gray" },
            { value: 0, label: `${normalizedFixture.away.flag} ${normalizedFixture.away.name}胜`, tone: "red" },
          ],
          h2hMatches: [],
          statGrid: [
            { value: String(statsByTeam.SHOTS_TOTAL?.home ?? 0), label: `${normalizedFixture.home.flag}射门` },
            { value: String(statsByTeam.BALL_POSSESSION?.home ?? 0), label: `${normalizedFixture.home.flag}控球` },
            { value: String(statsByTeam.CORNER_KICKS?.home ?? 0), label: `${normalizedFixture.home.flag}角球` },
            { value: String(statsByTeam.SHOTS_TOTAL?.away ?? 0), label: `${normalizedFixture.away.flag}射门` },
            { value: String(statsByTeam.BALL_POSSESSION?.away ?? 0), label: `${normalizedFixture.away.flag}控球` },
            { value: String(statsByTeam.CORNER_KICKS?.away ?? 0), label: `${normalizedFixture.away.flag}角球` },
          ],
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
