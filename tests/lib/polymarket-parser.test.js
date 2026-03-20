import { describe, it, expect } from "vitest";
import { extractTeamName, parseEvents } from "@/lib/polymarket-parser";

describe("extractTeamName", () => {
  it("extracts from groupItemTitle", () => {
    expect(extractTeamName({ groupItemTitle: "Spain" })).toBe("Spain");
  });

  it("extracts from question pattern", () => {
    expect(extractTeamName({ question: "Will Brazil win the 2026 World Cup?" })).toBe("Brazil");
  });

  it("returns null for empty market", () => {
    expect(extractTeamName({})).toBe(null);
  });
});

describe("parseEvents", () => {
  it("parses yes/no market correctly", () => {
    const events = [{
      markets: [{
        groupItemTitle: "France",
        outcomes: '["Yes","No"]',
        outcomePrices: '["0.15","0.85"]',
      }],
    }];
    const result = parseEvents(events);
    expect(result).toEqual([{ name: "France", probability: 15 }]);
  });

  it("returns empty array for empty input", () => {
    expect(parseEvents([])).toEqual([]);
    expect(parseEvents(null)).toEqual([]);
  });

  it("handles multi-outcome market", () => {
    const events = [{
      markets: [{
        outcomes: '["Spain","France","Brazil"]',
        outcomePrices: '["0.25","0.15","0.10"]',
      }],
    }];
    const result = parseEvents(events);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Spain");
    expect(result[0].probability).toBe(25);
  });
});
