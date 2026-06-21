import { describe, expect, it } from "vitest";
import {
  DEFAULT_ARR_LIMIT,
  clampLimit,
  defaultTitle,
  resolveArrConfig,
} from "./config";

describe("clampLimit", () => {
  it("returns DEFAULT_ARR_LIMIT for non-numeric input", () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_ARR_LIMIT);
    expect(clampLimit("5")).toBe(DEFAULT_ARR_LIMIT);
    expect(clampLimit(null)).toBe(DEFAULT_ARR_LIMIT);
    expect(clampLimit(Number.NaN)).toBe(DEFAULT_ARR_LIMIT);
    expect(clampLimit(Number.POSITIVE_INFINITY)).toBe(DEFAULT_ARR_LIMIT);
  });

  it("clamps to minimum of 1", () => {
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(-10)).toBe(1);
  });

  it("clamps to maximum of 50", () => {
    expect(clampLimit(51)).toBe(50);
    expect(clampLimit(1000)).toBe(50);
  });

  it("floors fractional values", () => {
    expect(clampLimit(3.9)).toBe(3);
    expect(clampLimit(1.1)).toBe(1);
  });

  it("passes through valid in-range integers", () => {
    expect(clampLimit(1)).toBe(1);
    expect(clampLimit(5)).toBe(5);
    expect(clampLimit(50)).toBe(50);
  });
});

describe("defaultTitle", () => {
  it("capitalises the service name", () => {
    expect(defaultTitle("sonarr")).toBe("Sonarr");
    expect(defaultTitle("radarr")).toBe("Radarr");
    expect(defaultTitle("lidarr")).toBe("Lidarr");
    expect(defaultTitle("readarr")).toBe("Readarr");
  });
});

describe("resolveArrConfig", () => {
  const base = {
    id: "w1",
    type: "arr",
    size: "small" as const,
    service: "sonarr",
    url: "http://sonarr:8989",
    api_key: "abc123",
  };

  it("returns connection for a valid config", () => {
    const result = resolveArrConfig(base);
    expect(result).toEqual({
      connection: {
        service: "sonarr",
        url: "http://sonarr:8989",
        apiKey: "abc123",
      },
    });
  });

  it("errors when service is missing", () => {
    const { service: _, ...rest } = base;
    const result = resolveArrConfig(rest);
    expect(result).toHaveProperty("error");
    expect("error" in result && result.error).toMatch(/service is required/);
  });

  it("errors when service is unknown", () => {
    const result = resolveArrConfig({ ...base, service: "plex" });
    expect(result).toHaveProperty("error");
    expect("error" in result && result.error).toMatch(/unknown service/);
  });

  it("errors when url is missing", () => {
    const { url: _, ...rest } = base;
    const result = resolveArrConfig(rest);
    expect(result).toHaveProperty("error");
    expect("error" in result && result.error).toMatch(/url is required/);
  });

  it("errors when api_key is missing", () => {
    const { api_key: _, ...rest } = base;
    const result = resolveArrConfig(rest);
    expect(result).toHaveProperty("error");
    expect("error" in result && result.error).toMatch(/api_key is required/);
  });

  it("coerces api_key to string", () => {
    const result = resolveArrConfig({
      ...base,
      api_key: 99999 as unknown as string,
    });
    expect(result).toHaveProperty("connection");
    if ("connection" in result) {
      expect(result.connection.apiKey).toBe("99999");
    }
  });
});
