import { describe, it, expect } from "vitest";
import { EN_TO_ZH } from "@/lib/polymarket-names";

describe("EN_TO_ZH mapping", () => {
  it("maps common team names", () => {
    expect(EN_TO_ZH["Spain"]).toBe("西班牙");
    expect(EN_TO_ZH["France"]).toBe("法国");
    expect(EN_TO_ZH["Brazil"]).toBe("巴西");
  });

  it("handles alternate names", () => {
    expect(EN_TO_ZH["USA"]).toBe("美国");
    expect(EN_TO_ZH["United States"]).toBe("美国");
    expect(EN_TO_ZH["Korea Republic"]).toBe("韩国");
    expect(EN_TO_ZH["South Korea"]).toBe("韩国");
  });

  it("has no undefined values", () => {
    Object.entries(EN_TO_ZH).forEach(([key, value]) => {
      expect(value).toBeDefined();
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    });
  });
});
