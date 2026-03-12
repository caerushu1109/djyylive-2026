import { matchdayState as localSeedState } from "./matchday-adapter.js";
import { providerSampleState } from "./provider-sample-state.js";

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
