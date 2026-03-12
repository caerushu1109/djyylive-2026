import { buildMatchdayStateFromSportMonks } from "./api-adapter-example.js?v=20260312ba";
import { sportMonksWorldCupSample } from "./provider-sample-payload.js?v=20260312ba";

export const providerSampleState = buildMatchdayStateFromSportMonks(sportMonksWorldCupSample);
