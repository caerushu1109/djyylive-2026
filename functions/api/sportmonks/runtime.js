const DEFAULT_BASE_URL = "https://api.sportmonks.com/v3/football";
const DEFAULT_FIXTURE_INCLUDE =
  "participants;scores;state;venue;events.type;lineups.details.type;statistics.type";
const DEFAULT_STANDINGS_INCLUDE = "participant;rule;details";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function buildSportMonksUrl(baseUrl, path, params) {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function fetchSportMonksJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SportMonks ${response.status}: ${text.slice(0, 240)}`);
  }

  return response.json();
}

function normalizeDateString(value) {
  return String(value || "").split(" ")[0] || "";
}

function addDays(dateString, offset) {
  const [year, month, day] = String(dateString || "")
    .split("-")
    .map((value) => Number(value));
  if (!year || !month || !day) {
    return "";
  }
  const utc = new Date(Date.UTC(year, month - 1, day + offset));
  return utc.toISOString().slice(0, 10);
}

function uniqueById(rows = []) {
  const seen = new Map();
  rows.filter(Boolean).forEach((row) => {
    seen.set(String(row.id), row);
  });
  return [...seen.values()];
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = env.SPORTMONKS_API_TOKEN;

  if (!token) {
    return json(
      {
        error: "Missing SPORTMONKS_API_TOKEN",
        hint: "Add SPORTMONKS_API_TOKEN in Cloudflare Pages project settings.",
      },
      500
    );
  }

  const url = new URL(request.url);
  const fixtureId = url.searchParams.get("fixtureId");
  const seasonId = url.searchParams.get("seasonId");
  const fixtureInclude =
    url.searchParams.get("fixtureInclude") || DEFAULT_FIXTURE_INCLUDE;
  const standingsInclude =
    url.searchParams.get("standingsInclude") || DEFAULT_STANDINGS_INCLUDE;
  const baseUrl = env.SPORTMONKS_BASE_URL || DEFAULT_BASE_URL;
  const dateWindowDays = Math.max(1, Math.min(60, Number(url.searchParams.get("dateWindowDays") || 45)));

  if (!fixtureId || !seasonId) {
    return json(
      {
        error: "Missing fixtureId or seasonId",
      },
      400
    );
  }

  const fixtureIds = [
    fixtureId,
    ...(url.searchParams.get("fixtureIds") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ];
  const uniqueFixtureIds = [...new Set(fixtureIds)];

  try {
    const primaryFixtureUrl = buildSportMonksUrl(baseUrl, `fixtures/${fixtureId}`, {
      api_token: token,
      include: fixtureInclude,
    });

    const standingsUrl = buildSportMonksUrl(baseUrl, `standings/seasons/${seasonId}`, {
      api_token: token,
      include: standingsInclude,
    });

    const extraFixtureUrls = uniqueFixtureIds
      .filter((id) => id !== String(fixtureId))
      .map((id) =>
        buildSportMonksUrl(baseUrl, `fixtures/${id}`, {
          api_token: token,
          include: fixtureInclude,
        })
      );

    const [fixtureResponse, standingsResponse, ...extraResponses] = await Promise.all([
      fetchSportMonksJson(primaryFixtureUrl),
      fetchSportMonksJson(standingsUrl),
      ...extraFixtureUrls.map(fetchSportMonksJson),
    ]);

    const primaryFixture = fixtureResponse.data;
    const kickoffDate = normalizeDateString(primaryFixture?.starting_at);

    let windowFixtures = [];
    if (kickoffDate) {
      try {
        const dateUrls = Array.from({ length: dateWindowDays }, (_, index) =>
          buildSportMonksUrl(baseUrl, `fixtures/date/${addDays(kickoffDate, index)}`, {
            api_token: token,
            include: fixtureInclude,
          })
        );
        const dateResponses = await Promise.all(dateUrls.map(fetchSportMonksJson));
        windowFixtures = dateResponses
          .flatMap((response) => response.data || [])
          .filter(
            (row) =>
              String(row.season_id) === String(seasonId) ||
              String(row.league_id) === String(primaryFixture?.league_id || "")
          );
      } catch (error) {
        console.warn("Failed to fetch SportMonks fixtures by date window", error);
      }
    }

    return json({
      provider: "sportmonks",
      fixture: primaryFixture,
      matches: uniqueById([
        ...windowFixtures,
        ...extraResponses.map((item) => item.data).filter(Boolean),
      ]).filter((row) => String(row.id) !== String(primaryFixture?.id || "")),
      standingsRows: standingsResponse.data || [],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return json(
      {
        error: error.message || "SportMonks runtime fetch failed",
      },
      502
    );
  }
}
