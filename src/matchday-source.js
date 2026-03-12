import { matchdayState as localSeedState } from "./matchday-adapter.js";
import { providerSampleState } from "./provider-sample-state.js";
import { buildMatchdayStateFromSportMonksApiSamples } from "./api-adapter-example.js";
import { sportMonksLiveSamplePayload } from "./sportmonks-live-sample-payload.js";
import { loadSportMonksRuntimeState } from "./provider-live-runtime.js";

const sourceMeta = {
  provider: "local-seed",
  mode: "seed",
  updatedAt: "2026-03-12",
};

function resolveInitialState() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("source");
  if (source === "provider-sample") {
    Object.assign(sourceMeta, {
      provider: "sportmonks-sample",
      mode: "sample",
      updatedAt: "2026-03-12",
    });
    return providerSampleState;
  }
  if (source === "sportmonks-live-sample") {
    Object.assign(sourceMeta, {
      provider: "sportmonks-live-sample",
      mode: "sample",
      updatedAt: "2026-03-12",
    });
    return buildMatchdayStateFromSportMonksApiSamples(sportMonksLiveSamplePayload);
  }
  if (source === "sportmonks-live") {
    Object.assign(sourceMeta, {
      provider: "sportmonks-live",
      mode: "live-pending",
      updatedAt: "2026-03-12",
    });
    return localSeedState;
  }
  return localSeedState;
}

let activeState = resolveInitialState();

export function getMatchdayState() {
  return activeState;
}

export function getMatchdaySourceMeta() {
  return sourceMeta;
}

export function setMatchdayState(nextState, meta = {}) {
  activeState = nextState;
  Object.assign(sourceMeta, meta);
}

export async function hydrateMatchdayStateFromRuntimeSource() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("source");

  if (source !== "sportmonks-live") {
    return activeState;
  }

  try {
    const state = await loadSportMonksRuntimeState();
    setMatchdayState(state, {
      provider: "sportmonks-live",
      mode: "live",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Failed to load sportmonks live runtime", error);
    setMatchdayState(localSeedState, {
      provider: "sportmonks-live",
      mode: "live-fallback",
      updatedAt: new Date().toISOString(),
    });
  }

  return activeState;
}
