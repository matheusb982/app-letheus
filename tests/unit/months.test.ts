import { describe, it, expect } from "vitest";
import { getMonthName, MONTH_NAMES } from "@/lib/utils/months";

describe("getMonthName", () => {
  it("returns correct month names", () => {
    expect(getMonthName(1)).toBe("Janeiro");
    expect(getMonthName(6)).toBe("Junho");
    expect(getMonthName(12)).toBe("Dezembro");
  });

  it("returns empty string for invalid months", () => {
    expect(getMonthName(0)).toBe("");
    expect(getMonthName(13)).toBe("");
  });
});

describe("MONTH_NAMES", () => {
  it("has 12 months", () => {
    expect(Object.keys(MONTH_NAMES)).toHaveLength(12);
  });
});
