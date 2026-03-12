import { buildMatchdayStateFromSportMonks } from "./api-adapter-example.js?v=20260312p";
import { sportMonksWorldCupSample } from "./provider-sample-payload.js?v=20260312p";

export const providerSampleState = buildMatchdayStateFromSportMonks(sportMonksWorldCupSample);
