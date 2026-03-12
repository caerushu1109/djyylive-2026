import { buildMatchdayStateFromSportMonksApiSamples } from "./api-adapter-example.js";

async function fetchJson(url) {
  const response = await window.fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
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

export async function loadSportMonksRuntimeState(configUrl = "/data/provider-live-config.json") {
  const config = await fetchJson(configUrl);

  if (config.provider !== "sportmonks") {
    throw new Error(`Unsupported live provider: ${config.provider}`);
  }

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

  const [fixtureResponse, standingsResponse] = await Promise.all([
    fetchJson(fixtureUrl),
    fetchJson(standingsUrl),
  ]);

  return buildMatchdayStateFromSportMonksApiSamples({
    match: fixtureResponse.data,
    standingsRows: standingsResponse.data || [],
  });
}

export async function loadCapturedSportMonksRuntimeState(basePath = "/data/provider-live") {
  const [fixtureResponse, standingsResponse] = await Promise.all([
    fetchJson(`${basePath}/sportmonks-fixture.json`),
    fetchJson(`${basePath}/sportmonks-standings.json`),
  ]);

  return buildMatchdayStateFromSportMonksApiSamples({
    match: fixtureResponse.data || fixtureResponse,
    standingsRows: standingsResponse.data || standingsResponse,
  });
}
