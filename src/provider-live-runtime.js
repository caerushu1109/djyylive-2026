import { buildMatchdayStateFromSportMonksApiSamples } from "./api-adapter-example.js";

async function fetchJson(url) {
  const response = await window.fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} for ${url}${body ? ` :: ${body.slice(0, 240)}` : ""}`);
  }

  return response.json();
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

async function loadSportMonksProxyRuntimeState(defaultsUrl = "/data/provider-live-config.example.json") {
  const defaults = await fetchJson(defaultsUrl);
  const fixtureIds = [defaults.fixtureId, ...(defaults.fixtureIds || [])]
    .filter(Boolean)
    .map((value) => String(value));

  const proxyUrl = buildSportMonksUrl(window.location.origin, "/api/sportmonks/runtime", {
    fixtureId: defaults.fixtureId,
    fixtureIds: fixtureIds.join(","),
    seasonId: defaults.seasonId,
    fixtureInclude: defaults.fixtureInclude,
    standingsInclude: defaults.standingsInclude,
  });

  const response = await fetchJson(proxyUrl);

  return buildMatchdayStateFromSportMonksApiSamples({
    match: response.fixture,
    matches: response.matches || [],
    standingsRows: response.standingsRows || [],
  });
}

export async function loadSportMonksRuntimeState(configUrl = "/data/provider-live-config.json") {
  try {
    return await loadSportMonksProxyRuntimeState();
  } catch (proxyError) {
    console.warn("Falling back to local SportMonks runtime config", proxyError);
  }

  const config = await fetchJson(configUrl);

  if (config.provider !== "sportmonks") {
    throw new Error(`Unsupported live provider: ${config.provider}`);
  }

  const fixtureIds = [config.fixtureId, ...(config.fixtureIds || [])]
    .filter(Boolean)
    .map((value) => String(value));
  const uniqueFixtureIds = [...new Set(fixtureIds)];

  const fixtureUrl = buildSportMonksUrl(
    config.baseUrl || "https://api.sportmonks.com/v3/football",
    `fixtures/${config.fixtureId}`,
    {
      api_token: config.apiToken,
      include: config.fixtureInclude,
    }
  );

  const standingsUrl = buildSportMonksUrl(
    config.baseUrl || "https://api.sportmonks.com/v3/football",
    `standings/seasons/${config.seasonId}`,
    {
      api_token: config.apiToken,
      include: config.standingsInclude,
    }
  );

  const fixtureListResponses = await Promise.all(
    uniqueFixtureIds
      .filter((fixtureId) => fixtureId !== String(config.fixtureId))
      .map((fixtureId) =>
        fetchJson(
          buildSportMonksUrl(
            config.baseUrl || "https://api.sportmonks.com/v3/football",
            `fixtures/${fixtureId}`,
            {
              api_token: config.apiToken,
              include: config.fixtureInclude,
            }
          )
        )
      )
  );

  const [fixtureResponse, standingsResponse] = await Promise.all([fetchJson(fixtureUrl), fetchJson(standingsUrl)]);

  return buildMatchdayStateFromSportMonksApiSamples({
    match: fixtureResponse.data,
    matches: fixtureListResponses.map((response) => response.data).filter(Boolean),
    standingsRows: standingsResponse.data || [],
  });
}

export async function loadCapturedSportMonksRuntimeState(basePath = "/data/provider-live") {
  const [fixtureResponse, fixturesResponse, standingsResponse] = await Promise.all([
    fetchJson(`${basePath}/sportmonks-fixture.json`),
    fetchJson(`${basePath}/sportmonks-fixtures.json`).catch(() => null),
    fetchJson(`${basePath}/sportmonks-standings.json`),
  ]);

  return buildMatchdayStateFromSportMonksApiSamples({
    match: fixtureResponse.data || fixtureResponse,
    matches: fixturesResponse?.data || fixturesResponse?.matches || fixturesResponse || [],
    standingsRows: standingsResponse.data || standingsResponse,
  });
}
