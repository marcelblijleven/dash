import { describe, expect, it } from "vitest";
import { parseTimeleft } from "./client";

describe("parseTimeleft", () => {
  it("returns null for undefined or empty string", () => {
    expect(parseTimeleft(undefined)).toBeNull();
    expect(parseTimeleft("")).toBeNull();
  });

  it("returns null for strings that don't match the expected format", () => {
    expect(parseTimeleft("invalid")).toBeNull();
    expect(parseTimeleft("1:30")).toBeNull();
    expect(parseTimeleft("90")).toBeNull();
  });

  it("parses HH:MM:SS format", () => {
    expect(parseTimeleft("00:00:45")).toBe(45);
    expect(parseTimeleft("00:01:30")).toBe(90);
    expect(parseTimeleft("01:30:00")).toBe(5400);
    expect(parseTimeleft("02:00:00")).toBe(7200);
  });

  it("parses D.HH:MM:SS format", () => {
    expect(parseTimeleft("1.00:00:00")).toBe(86400);
    expect(parseTimeleft("1.02:30:00")).toBe(86400 + 7200 + 1800);
    expect(parseTimeleft("2.12:00:00")).toBe(2 * 86400 + 12 * 3600);
  });
});
