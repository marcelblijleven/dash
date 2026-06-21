import { describe, expect, it } from "vitest";
import type { Service } from "./types";
import { buildServiceMap, extractHosts, serviceHealthy } from "./utils";

describe("extractHosts", () => {
  it("returns an empty array for a rule with no Host matcher", () => {
    expect(extractHosts("PathPrefix(`/api`)")).toEqual([]);
    expect(extractHosts("")).toEqual([]);
  });

  it("extracts a single host", () => {
    expect(extractHosts("Host(`example.com`)")).toEqual(["example.com"]);
  });

  it("extracts multiple hosts from an OR rule", () => {
    expect(
      extractHosts("Host(`a.example.com`) || Host(`b.example.com`)"),
    ).toEqual(["a.example.com", "b.example.com"]);
  });

  it("returns correct results on repeated calls with the same rule", () => {
    expect(extractHosts("Host(`first.com`)")).toEqual(["first.com"]);
    expect(extractHosts("Host(`second.com`)")).toEqual(["second.com"]);
  });
});

describe("serviceHealthy", () => {
  function svc(serverStatus?: Record<string, "UP" | "DOWN">): Service {
    return { name: "svc", status: "enabled", serverStatus };
  }

  it("returns null when serverStatus is absent", () => {
    expect(serviceHealthy(svc())).toBeNull();
  });

  it("returns null when serverStatus is empty", () => {
    expect(serviceHealthy(svc({}))).toBeNull();
  });

  it("returns true when all servers are UP", () => {
    expect(serviceHealthy(svc({ "http://s1:80": "UP" }))).toBe(true);
    expect(
      serviceHealthy(svc({ "http://s1:80": "UP", "http://s2:80": "UP" })),
    ).toBe(true);
  });

  it("returns false when any server is DOWN", () => {
    expect(serviceHealthy(svc({ "http://s1:80": "DOWN" }))).toBe(false);
    expect(
      serviceHealthy(svc({ "http://s1:80": "UP", "http://s2:80": "DOWN" })),
    ).toBe(false);
  });
});

describe("buildServiceMap", () => {
  function svc(name: string): Service {
    return { name, status: "enabled" };
  }

  it("maps services by name", () => {
    const map = buildServiceMap([svc("myservice")]);
    expect(map.get("myservice")).toBeDefined();
  });

  it("also maps by the base name when a provider suffix is present", () => {
    const s = svc("sonarr@docker");
    const map = buildServiceMap([s]);
    expect(map.get("sonarr@docker")).toBe(s);
    expect(map.get("sonarr")).toBe(s);
  });

  it("does not overwrite an existing base-name entry with a second provider", () => {
    const first = svc("svc@docker");
    const second = svc("svc@file");
    const map = buildServiceMap([first, second]);
    expect(map.get("svc")).toBe(first);
    expect(map.get("svc@docker")).toBe(first);
    expect(map.get("svc@file")).toBe(second);
  });

  it("handles an empty list", () => {
    expect(buildServiceMap([]).size).toBe(0);
  });
});
