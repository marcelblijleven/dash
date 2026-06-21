import { describe, expect, it } from "vitest";
import { formatDateTime, formatDuration } from "./format";

describe("formatDuration", () => {
  it("formats minutes under 1 hour", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(30)).toBe("30m");
    expect(formatDuration(59)).toBe("59m");
  });

  it("formats whole hours", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours with leftover minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(121)).toBe("2h 1m");
  });
});

describe("formatDateTime", () => {
  it("produces the same output as the equivalent Date.toLocaleString call", () => {
    const iso = "2026-03-15T14:30:00.000Z";
    const expected = new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(formatDateTime(iso)).toBe(expected);
  });

  it("returns a non-empty string for valid ISO input", () => {
    expect(formatDateTime("2026-01-01T00:00:00.000Z").length).toBeGreaterThan(
      0,
    );
  });
});
