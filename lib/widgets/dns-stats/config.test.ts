import { describe, expect, it } from "vitest";
import { blockedPercent } from "@/lib/dns/client";
import { resolveDnsConfig } from "./config";

function widget(extra: Record<string, unknown>) {
  return {
    type: "dns-stats",
    size: "medium" as const,
    id: "dns-stats-0",
    ...extra,
  };
}

describe("resolveDnsConfig", () => {
  it("requires a provider", () => {
    const r = resolveDnsConfig(widget({}));
    expect("error" in r && r.error).toMatch(/provider is required/);
  });

  it("rejects an unknown provider", () => {
    const r = resolveDnsConfig(widget({ provider: "nextdns" }));
    expect("error" in r && r.error).toMatch(/unknown provider/);
  });

  it("requires a url", () => {
    const r = resolveDnsConfig(widget({ provider: "pihole" }));
    expect("error" in r && r.error).toMatch(/url is required/);
  });

  it("resolves a pihole connection with an optional password", () => {
    const r = resolveDnsConfig(
      widget({ provider: "pihole", url: "http://pi.hole", password: "secret" }),
    );
    expect(r).toEqual({
      connection: {
        provider: "pihole",
        url: "http://pi.hole",
        password: "secret",
      },
    });
  });

  it("allows pihole without a password", () => {
    const r = resolveDnsConfig(
      widget({ provider: "pihole", url: "http://pi.hole" }),
    );
    expect("connection" in r && r.connection.provider).toBe("pihole");
  });

  it("requires username and password for adguard", () => {
    const r = resolveDnsConfig(
      widget({ provider: "adguard", url: "http://adguard", username: "admin" }),
    );
    expect("error" in r && r.error).toMatch(/username and password/);
  });

  it("resolves an adguard connection", () => {
    const r = resolveDnsConfig(
      widget({
        provider: "adguard",
        url: "http://adguard",
        username: "admin",
        password: "pw",
      }),
    );
    expect(r).toEqual({
      connection: {
        provider: "adguard",
        url: "http://adguard",
        username: "admin",
        password: "pw",
      },
    });
  });
});

describe("blockedPercent", () => {
  it("returns 0 when there are no queries", () => {
    expect(blockedPercent(0, 0)).toBe(0);
  });

  it("computes a percentage", () => {
    expect(blockedPercent(200, 50)).toBe(25);
  });

  it("clamps to 100", () => {
    expect(blockedPercent(10, 50)).toBe(100);
  });
});
