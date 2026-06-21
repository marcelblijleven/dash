import { mkdirSync } from "node:fs";
import { test } from "@playwright/test";

const OUT_DIR = "/tmp/dash-theme-shots/glass";

const THEMES = ["catppuccin", "tokyo-night", "orange"] as const;
const MODES = ["light", "dark"] as const;
const GLASS = ["none", "subtle", "regular", "clear"] as const;

test.beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
});

for (const theme of THEMES) {
  for (const mode of MODES) {
    for (const glass of GLASS) {
      test(`${theme} · ${mode} · glass=${glass}`, async ({ page }) => {
        await page.addInitScript((m) => {
          try {
            window.localStorage.setItem("dash-theme", m);
          } catch {}
        }, mode);
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.evaluate(
          ({ t, m, g }) => {
            document.documentElement.setAttribute("data-theme", t);
            document.documentElement.setAttribute("data-glass", g);
            document.documentElement.classList.toggle("dark", m === "dark");
          },
          { t: theme, m: mode, g: glass },
        );
        await page.waitForTimeout(400);
        await page.screenshot({
          path: `${OUT_DIR}/${theme}-${mode}-${glass}.png`,
          fullPage: true,
        });
      });
    }
  }
}
