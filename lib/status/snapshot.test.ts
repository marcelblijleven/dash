import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/docker", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/docker")>();
  return {
    ...actual,
    listContainers: vi.fn(),
  };
});

vi.mock("@/lib/traefik", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/traefik")>();
  return {
    ...actual,
    listRouters: vi.fn(),
  };
});

vi.mock("@/lib/config/loader", () => ({
  loadConfig: vi.fn(),
}));

import { loadConfig } from "@/lib/config/loader";
import { listContainers } from "@/lib/docker";
import { listRouters } from "@/lib/traefik";
import { getStatusSnapshot } from "./snapshot";

function container(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    Id: "id1",
    Names: ["/svc"],
    Image: "img",
    ImageID: "img",
    Created: 0,
    State: "running",
    Status: "Up",
    Labels: {
      "dash.enable": "true",
      "dash.url": "https://svc.example",
      "dash.category": "media",
      "dash.title": "Service",
    },
    Ports: [],
    ...overrides,
  };
}

describe("getStatusSnapshot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T00:00:00Z"));
    vi.mocked(listContainers).mockReset();
    vi.mocked(listRouters).mockReset();
    vi.mocked(loadConfig).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("falls back to empty lists when docker, traefik and config all reject", async () => {
    vi.mocked(listContainers).mockRejectedValue(new Error("docker down"));
    vi.mocked(listRouters).mockRejectedValue(new Error("traefik down"));
    vi.mocked(loadConfig).mockRejectedValue(new Error("no config"));

    const snap = await getStatusSnapshot();
    expect(snap.entries).toEqual([]);
    expect(snap.generatedAt).toBe(Date.parse("2026-06-19T00:00:00Z"));
  });

  it("maps containers and config apps to StatusEntries, sorted by name", async () => {
    vi.mocked(listContainers).mockResolvedValue([
      container({ Id: "c1", Names: ["/zeta"], Labels: { "dash.enable": "true", "dash.url": "https://zeta", "dash.category": "media", "dash.title": "Zeta" } }),
      container({ Id: "c2", Names: ["/alpha"], State: "exited", Labels: { "dash.enable": "true", "dash.url": "https://alpha", "dash.category": "media", "dash.title": "Alpha" } }),
    ]);
    vi.mocked(listRouters).mockResolvedValue([]);
    vi.mocked(loadConfig).mockResolvedValue({
      config: {
        docker: { proxy_url: "http://x" },
        traefik: { api_url: "http://y" },
        apps: [
          {
            title: "Manual",
            url: "https://manual",
            category: "tools",
            shortcuts: [],
          },
        ],
        widgets: [],
      },
      error: null,
      source: "test",
    });

    const snap = await getStatusSnapshot();
    expect(snap.entries.map((e) => e.name)).toEqual([
      "Alpha",
      "Manual",
      "Zeta",
    ]);
    expect(snap.entries[0]).toMatchObject({
      name: "Alpha",
      running: false,
      healthy: false,
      category: "media",
    });
    expect(snap.entries[1]).toMatchObject({
      name: "Manual",
      running: true,
      healthy: true,
      category: "tools",
    });
  });

  it("treats a fulfilled but null config result as no apps", async () => {
    vi.mocked(listContainers).mockResolvedValue([]);
    vi.mocked(listRouters).mockResolvedValue([]);
    vi.mocked(loadConfig).mockResolvedValue(null as unknown as Awaited<
      ReturnType<typeof loadConfig>
    >);

    const snap = await getStatusSnapshot();
    expect(snap.entries).toEqual([]);
  });
});
