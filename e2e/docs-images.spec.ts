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
});

// Viewport screenshots for all light-mode themes (used for the composite grid).
for (const preset of PRESETS) {
  test(`viewport · ${preset} · light`, async ({ page }) => {
    await setupMocks(page, Date.now());
    await navigateWithTheme(page, preset, "light");
    await page.screenshot({
      path: `${VIEWPORT_DIR}/${preset}-light.png`,
      fullPage: false,
    });
  });
}

// Composite "all themes" preview grid built from the viewport shots above.
// This test must run after all viewport shots are taken.
test("compose themes-preview grid", async ({ page }) => {
  const COLS = 4;
  const THUMB_W = 360;
  const THUMB_H = 225;
  const GAP = 4;

  const rows = Math.ceil(PRESETS.length / COLS);
  const canvasW = COLS * THUMB_W + (COLS - 1) * GAP;
  const canvasH = rows * THUMB_H + (rows - 1) * GAP;

  const images: { preset: string; b64: string }[] = PRESETS.map((preset) => ({
    preset,
    b64: readFileSync(`${VIEWPORT_DIR}/${preset}-light.png`).toString("base64"),
  }));

  const imgTags = images
    .map(({ preset, b64 }, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = col * (THUMB_W + GAP);
      const y = row * (THUMB_H + GAP);
      return `<img src="data:image/png;base64,${b64}" data-theme="${preset}"
          style="position:absolute;left:${x}px;top:${y}px;width:${THUMB_W}px;height:${THUMB_H}px;object-fit:cover;object-position:top left;">`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #111; width: ${canvasW}px; height: ${canvasH}px; overflow: hidden; }
  .grid { position: relative; width: ${canvasW}px; height: ${canvasH}px; }
</style>
</head>
<body>
<div class="grid">
${imgTags}
</div>
</body>
</html>`;

  await page.setViewportSize({ width: canvasW, height: canvasH });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  mkdirSync("docs", { recursive: true });
  await page.screenshot({ path: "docs/themes-preview.png", fullPage: false });
});

// Orange-light viewport screenshot — the README hero.
test("hero · orange · light", async ({ page }) => {
  await setupMocks(page, Date.now());
  await navigateWithTheme(page, "orange", "light");
  mkdirSync("docs", { recursive: true });
  await page.screenshot({ path: "docs/screenshot.png", fullPage: false });
});
