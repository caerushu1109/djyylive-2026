import { buildMatchdayStateFromSportMonks } from "./api-adapter-example.js";
import { sportMonksWorldCupSample } from "./provider-sample-payload.js";

export const providerSampleState = buildMatchdayStateFromSportMonks(sportMonksWorldCupSample);
