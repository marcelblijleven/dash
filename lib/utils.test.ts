import { describe, expect, it } from "vitest";
import { formatBytes, formatUptime } from "./utils";

describe("formatBytes", () => {
  it("formats bytes under 1 KiB", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats KiB, MiB, GiB, TiB", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 ** 2)).toBe("5.0 MB");
    expect(formatBytes(3 * 1024 ** 3)).toBe("3.00 GB");
    expect(formatBytes(2 * 1024 ** 4)).toBe("2.00 TB");
  });
});

describe("formatUptime", () => {
  it("renders minutes when under an hour", () => {
    expect(formatUptime(0)).toBe("0m");
    expect(formatUptime(59)).toBe("0m");
    expect(formatUptime(60)).toBe("1m");
  });

  it("renders hours + minutes when under a day", () => {
    expect(formatUptime(3600)).toBe("1h 0m");
    expect(formatUptime(3600 + 120)).toBe("1h 2m");
  });

  it("renders days + hours when over a day", () => {
    expect(formatUptime(86400)).toBe("1d 0h");
    expect(formatUptime(86400 * 2 + 3600 * 5)).toBe("2d 5h");
  });
});
