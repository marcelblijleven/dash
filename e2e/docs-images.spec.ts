import { mkdirSync, readFileSync } from "node:fs";
import { test } from "@playwright/test";

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

type Preset = (typeof PRESETS)[number];

const N = PRESETS.length;
const MEM_TOTAL = 32 * 1024 * 1024 * 1024;

function buildSamples(now: number) {
  return Array.from({ length: 60 }, (_, i) => {
    const phase = (i / 59) * Math.PI * 2;
    return {
      t: now - (59 - i) * 5_000,
      loadAvg: [
        Math.max(0, 0.35 + Math.sin(phase) * 0.18),
        Math.max(0, 0.33 + Math.sin(phase - 0.3) * 0.14),
        Math.max(0, 0.31 + Math.sin(phase - 0.6) * 0.09),
      ] as [number, number, number],
      memUsed: Math.round(
        17 * 1024 * 1024 * 1024 + Math.sin(phase * 0.5) * 512 * 1024 * 1024,
      ),
      memTotal: MEM_TOTAL,
      ncpu: 8,
    };
  });
}

async function setupMocks(page: import("@playwright/test").Page, now: number) {
  const mockHostStats = {
    uptime: 1_234_567,
    loadAvg: [0.42, 0.38, 0.31] as [number, number, number],
    memTotal: MEM_TOTAL,
    memAvailable: MEM_TOTAL - 17 * 1024 * 1024 * 1024,
    ncpu: 8,
    samples: buildSamples(now),
  };
  await page.route("/api/widgets/host-stats", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockHostStats),
    }),
  );
  await page.route("/api/widgets/docker-stats", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 19, running: 17, unhealthy: 1 }),
    }),
  );
  await page.route("/api/widgets/traefik-status", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        routerCount: 17,
        enabledCount: 15,
        servicesDown: 1,
      }),
    }),
  );
  await page.route("/api/widgets/host-stats/stream", (r) =>
    r.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: `data: ${JSON.stringify(mockHostStats)}\n\n`,
    }),
  );
  await page.route("/api/status/stream", (r) => r.abort());
}

async function navigateWithTheme(
  page: import("@playwright/test").Page,
  preset: Preset,
  mode: "light" | "dark",
) {
  await page.addInitScript((m) => {
    try {
      window.localStorage.setItem("dash-theme", m);
    } catch {
      // ignore
    }
  }, mode);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ p, m }) => {
      document.documentElement.setAttribute("data-theme", p);
      document.documentElement.classList.toggle("dark", m === "dark");
    },
    { p: preset, m: mode },
  );
  await page.waitForTimeout(600);
}

const VIEWPORT_DIR = "/tmp/dash-viewports";

test.beforeAll(() => {
  mkdirSync(VIEWPORT_DIR, { recursive: true });
  mkdirSync("docs/themes", { recursive: true });
});

// Viewport screenshots for all themes × both modes.
// Light shots are also saved to docs/themes/ for the README.
for (const preset of PRESETS) {
  for (const mode of ["light", "dark"] as const) {
    test(`viewport · ${preset} · ${mode}`, async ({ page }) => {
      await setupMocks(page, Date.now());
      await navigateWithTheme(page, preset, mode);
      const tmp = `${VIEWPORT_DIR}/${preset}-${mode}.png`;
      await page.screenshot({ path: tmp, fullPage: false });
      if (mode === "light") {
        // Copy into docs/themes/ directly from the page for repo inclusion.
        await page.screenshot({
          path: `docs/themes/${preset}-light.png`,
          fullPage: false,
        });
      }
    });
  }
}

// Single composite: diagonal strips, light on top half, dark on bottom half.
// Each theme i occupies a forward-slash "/" angled parallelogram strip.
// Out-of-bounds polygon vertices are clipped by the browser to the element edge,
// so no gap-filling or special-casing is needed for the first/last strips.
test("compose themes-preview diagonal", async ({ page }) => {
  const W = 1440;
  const H = 300; // height of each section (light / dark)
  const D = 80; // horizontal drift (px) from top to bottom of each strip
  const step = W / N;

  function clip(i: number): string {
    const x0t = Math.round(i * step);
    const x1t = Math.round((i + 1) * step);
    const x0b = Math.round(i * step + D);
    const x1b = Math.round((i + 1) * step + D);
    return `polygon(${x0t}px 0,${x1t}px 0,${x1b}px ${H}px,${x0b}px ${H}px)`;
  }

  const imgStyle = (top: number, c: string) =>
    `position:absolute;top:${top}px;left:0;width:${W}px;height:${H}px;` +
    `object-fit:cover;object-position:top left;clip-path:${c}`;

  const imgs = PRESETS.flatMap((preset, i) => {
    const c = clip(i);
    const lb64 = readFileSync(`${VIEWPORT_DIR}/${preset}-light.png`).toString(
      "base64",
    );
    const db64 = readFileSync(`${VIEWPORT_DIR}/${preset}-dark.png`).toString(
      "base64",
    );
    return [
      `<img src="data:image/png;base64,${lb64}" style="${imgStyle(0, c)}">`,
      `<img src="data:image/png;base64,${db64}" style="${imgStyle(H, c)}">`,
    ];
  }).join("\n");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H * 2}px;overflow:hidden;background:#000}
</style>
</head>
<body>${imgs}</body>
</html>`;

  await page.setViewportSize({ width: W, height: H * 2 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  mkdirSync("docs", { recursive: true });
  await page.screenshot({ path: "docs/themes-preview.png", fullPage: false });
});

// Orange-light viewport — README hero.
test("hero · orange · light", async ({ page }) => {
  await setupMocks(page, Date.now());
  await navigateWithTheme(page, "orange", "light");
  mkdirSync("docs", { recursive: true });
  await page.screenshot({ path: "docs/screenshot.png", fullPage: false });
});
