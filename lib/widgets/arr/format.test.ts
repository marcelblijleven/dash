import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatAirDate, formatEta } from "./format";

describe("formatEta", () => {
  it("formats seconds under 1 minute", () => {
    expect(formatEta(0)).toBe("0s");
    expect(formatEta(45)).toBe("45s");
    expect(formatEta(59)).toBe("59s");
  });

  it("formats minutes under 1 hour", () => {
    expect(formatEta(60)).toBe("1m");
    expect(formatEta(90)).toBe("1m");
    expect(formatEta(3540)).toBe("59m");
  });

  it("formats whole hours", () => {
    expect(formatEta(3600)).toBe("1h");
    expect(formatEta(7200)).toBe("2h");
  });

  it("formats hours with leftover minutes", () => {
    expect(formatEta(3660)).toBe("1h 1m");
    expect(formatEta(5400)).toBe("1h 30m");
    expect(formatEta(7260)).toBe("2h 1m");
  });
});

describe("formatAirDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns '-' for empty string", () => {
    expect(formatAirDate("")).toBe("-");
  });

  it("returns '-' for an invalid date string", () => {
    expect(formatAirDate("not-a-date")).toBe("-");
  });

  it("returns 'today · <time>' for today's date", () => {
    const todayIso = new Date("2026-06-15T18:30:00.000Z").toISOString();
    expect(formatAirDate(todayIso)).toMatch(/^today · /);
  });

  it("returns 'tomorrow · <time>' for tomorrow's date", () => {
    const tomorrowIso = new Date("2026-06-16T09:00:00.000Z").toISOString();
    expect(formatAirDate(tomorrowIso)).toMatch(/^tomorrow · /);
  });

  it("returns a locale date string for dates further in the future", () => {
    const futureIso = new Date("2026-06-20T12:00:00.000Z").toISOString();
    const result = formatAirDate(futureIso);
    expect(result).not.toMatch(/^today/);
    expect(result).not.toMatch(/^tomorrow/);
    expect(result.length).toBeGreaterThan(0);
  });
});
