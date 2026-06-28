import { describe, expect, it } from "vitest";
import { parseColonTime } from "@/lib/download/client";
import {
  clampLimit,
  DEFAULT_DOWNLOAD_LIMIT,
  resolveDownloadConfig,
} from "./config";

function widget(extra: Record<string, unknown>) {
  return {
    type: "download-client",
    size: "medium" as const,
    id: "download-client-0",
    ...extra,
  };
}

describe("clampLimit", () => {
  it("returns the default for non-numeric input", () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_DOWNLOAD_LIMIT);
    expect(clampLimit("5")).toBe(DEFAULT_DOWNLOAD_LIMIT);
  });

  it("clamps to the 1..50 range and floors fractions", () => {
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(99)).toBe(50);
    expect(clampLimit(4.9)).toBe(4);
  });
});

describe("resolveDownloadConfig", () => {
  it("requires a client", () => {
    const r = resolveDownloadConfig(widget({}));
    expect("error" in r && r.error).toMatch(/client is required/);
  });

  it("rejects an unknown client", () => {
    const r = resolveDownloadConfig(widget({ client: "deluge" }));
    expect("error" in r && r.error).toMatch(/unknown client/);
  });

  it("requires a url", () => {
    const r = resolveDownloadConfig(widget({ client: "qbittorrent" }));
    expect("error" in r && r.error).toMatch(/url is required/);
  });

  it("requires api_key for sabnzbd", () => {
    const r = resolveDownloadConfig(
      widget({ client: "sabnzbd", url: "http://sab" }),
    );
    expect("error" in r && r.error).toMatch(/api_key is required/);
  });

  it("resolves a sabnzbd connection", () => {
    const r = resolveDownloadConfig(
      widget({ client: "sabnzbd", url: "http://sab", api_key: "k" }),
    );
    expect(r).toEqual({
      connection: { client: "sabnzbd", url: "http://sab", apiKey: "k" },
    });
  });

  it("resolves a qbittorrent connection with optional auth", () => {
    const r = resolveDownloadConfig(
      widget({
        client: "qbittorrent",
        url: "http://qbit",
        username: "admin",
        password: "pw",
      }),
    );
    expect(r).toEqual({
      connection: {
        client: "qbittorrent",
        url: "http://qbit",
        username: "admin",
        password: "pw",
      },
    });
  });

  it("resolves an nzbget connection", () => {
    const r = resolveDownloadConfig(
      widget({ client: "nzbget", url: "http://nzb", username: "nzbget" }),
    );
    expect("connection" in r && r.connection.client).toBe("nzbget");
  });
});

describe("parseColonTime", () => {
  it("returns null for empty input", () => {
    expect(parseColonTime(undefined)).toBeNull();
    expect(parseColonTime("")).toBeNull();
  });

  it("parses H:MM:SS", () => {
    expect(parseColonTime("1:02:03")).toBe(3723);
  });

  it("parses M:SS", () => {
    expect(parseColonTime("16:44")).toBe(1004);
  });

  it("returns null for non-numeric parts", () => {
    expect(parseColonTime("a:b")).toBeNull();
  });
});
