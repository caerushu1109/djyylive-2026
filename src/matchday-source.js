import { matchdayState as localSeedState } from "./matchday-adapter.js";

const sourceMeta = {
  provider: "local-seed",
  mode: "seed",
  updatedAt: "2026-03-12",
};

let activeState = localSeedState;

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
