import { mkdirSync } from "node:fs";
import { test } from "@playwright/test";

const OUT_DIR = "/tmp/dash-screenshots";

const PAGES = [
  { name: "home", path: "/" },
  { name: "containers", path: "/containers" },
  { name: "routers", path: "/routers" },
  { name: "status", path: "/status" },
] as const;

const PRESETS = [
  "orange",
  "blue",
  "green",
  "purple",
  "rose",
  "mono",
  "catppuccin",
  "tokyo-night",
  "dracula",
  "nord",
  "gruvbox",
] as const;

const MODES = ["light", "dark"] as const;

const MEM_TOTAL = 32 * 1024 * 1024 * 1024;

function buildSamples(now: number) {
  return Array.from({ length: 60 }, (_, i) => {
    const phase = (i / 59) * Math.PI * 2;
    const load1 = 0.35 + Math.sin(phase) * 0.18;
    const load5 = 0.33 + Math.sin(phase - 0.3) * 0.14;
    const load15 = 0.31 + Math.sin(phase - 0.6) * 0.09;
    const memUsed =
      17 * 1024 * 1024 * 1024 + Math.sin(phase * 0.5) * 512 * 1024 * 1024;
    return {
      t: now - (59 - i) * 5_000,
      loadAvg: [
        Math.max(0, load1),
        Math.max(0, load5),
        Math.max(0, load15),
      ] as [number, number, number],
      memUsed: Math.round(memUsed),
      memTotal: MEM_TOTAL,
      ncpu: 8,
    };
  });
}

const MOCK_DOCKER_STATS = { total: 19, running: 17, unhealthy: 1 };
const MOCK_TRAEFIK_STATUS = {
  routerCount: 17,
  enabledCount: 15,
  servicesDown: 1,
};

test.beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const page of PAGES) {
    mkdirSync(`${OUT_DIR}/${page.name}`, { recursive: true });
  }
});

for (const pageConfig of PAGES) {
  for (const preset of PRESETS) {
    for (const mode of MODES) {
      test(`${pageConfig.name} · ${preset} · ${mode}`, async ({ page }) => {
        const now = Date.now();
        const samples = buildSamples(now);
        const mockHostStats = {
          uptime: 1_234_567,
          loadAvg: [0.42, 0.38, 0.31] as [number, number, number],
          memTotal: MEM_TOTAL,
          memAvailable: MEM_TOTAL - 17 * 1024 * 1024 * 1024,
          ncpu: 8,
          samples,
        };

        await page.route("/api/widgets/host-stats", (route) => {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockHostStats),
          });
        });

        await page.route("/api/widgets/docker-stats", (route) => {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(MOCK_DOCKER_STATS),
          });
        });

        await page.route("/api/widgets/traefik-status", (route) => {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(MOCK_TRAEFIK_STATUS),
          });
        });

        await page.route("/api/widgets/host-stats/stream", (route) => {
          route.fulfill({
            status: 200,
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
            body: `data: ${JSON.stringify(mockHostStats)}\n\n`,
          });
        });

        await page.route("/api/status/stream", (route) => route.abort());

        await page.addInitScript((m) => {
          try {
            window.localStorage.setItem("dash-theme", m);
          } catch {
            // ignore
          }
        }, mode);

        await page.goto(pageConfig.path, { waitUntil: "domcontentloaded" });

        await page.evaluate(
          ({ p, m }) => {
            document.documentElement.setAttribute("data-theme", p);
            document.documentElement.classList.toggle("dark", m === "dark");
          },
          { p: preset, m: mode },
        );

        await page.waitForTimeout(600);

        await page.screenshot({
          path: `${OUT_DIR}/${pageConfig.name}/${preset}-${mode}.png`,
          fullPage: true,
        });
      });
    }
  }
}
