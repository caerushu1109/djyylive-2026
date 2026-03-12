import { buildMatchdayStateFromSportMonks } from "./api-adapter-example.js?v=20260312q";
import { sportMonksWorldCupSample } from "./provider-sample-payload.js?v=20260312q";

export const providerSampleState = buildMatchdayStateFromSportMonks(sportMonksWorldCupSample);
