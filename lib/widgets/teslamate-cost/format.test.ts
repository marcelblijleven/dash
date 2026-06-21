import { describe, expect, it } from "vitest";
import { formatMonth } from "./format";

describe("formatMonth", () => {
  it("produces the same output as formatting the corresponding local Date", () => {
    const cases: [string, number, number][] = [
      ["2024-01", 2024, 0],
      ["2024-06", 2024, 5],
      ["2024-12", 2024, 11],
      ["2025-03", 2025, 2],
    ];
    for (const [iso, year, monthIndex] of cases) {
      const expected = new Date(year, monthIndex, 1).toLocaleString(undefined, {
        month: "short",
        year: "2-digit",
      });
      expect(formatMonth(iso)).toBe(expected);
    }
  });
});
