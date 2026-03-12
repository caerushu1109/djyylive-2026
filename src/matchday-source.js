import { matchdayState as localSeedState } from "./matchday-adapter.js";
import { providerSampleState } from "./provider-sample-state.js";
import { buildMatchdayStateFromSportMonksApiSamples } from "./api-adapter-example.js";
import { sportMonksLiveSamplePayload } from "./sportmonks-live-sample-payload.js";
import {
  loadCapturedSportMonksRuntimeState,
  loadSportMonksRuntimeState,
} from "./provider-live-runtime.js";

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
  if (source === "sportmonks-captured") {
    Object.assign(sourceMeta, {
      provider: "sportmonks-captured",
      mode: "captured-pending",
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

  if (!["sportmonks-live", "sportmonks-captured"].includes(source)) {
    return activeState;
  }

  try {
    const state = source === "sportmonks-captured"
      ? await loadCapturedSportMonksRuntimeState()
      : await loadSportMonksRuntimeState();
    setMatchdayState(state, {
      provider: source,
      mode: source === "sportmonks-captured" ? "captured" : "live",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn(`Failed to load ${source} runtime`, error);
    setMatchdayState(localSeedState, {
      provider: source,
      mode: source === "sportmonks-captured" ? "captured-fallback" : "live-fallback",
      updatedAt: new Date().toISOString(),
    });
  }

  return activeState;
}
