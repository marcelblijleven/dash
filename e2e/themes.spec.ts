import { mkdirSync } from "node:fs";
import { test } from "@playwright/test";

const OUT_DIR = "/tmp/dash-theme-shots";

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

test.beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
});

for (const preset of PRESETS) {
  for (const mode of MODES) {
    test(`${preset} · ${mode}`, async ({ page }) => {
      await page.addInitScript((m) => {
        try {
          window.localStorage.setItem("dash-theme", m);
        } catch {}
      }, mode);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.evaluate(
        ({ p, m }) => {
          document.documentElement.setAttribute("data-theme", p);
          document.documentElement.classList.toggle("dark", m === "dark");
        },
        { p: preset, m: mode },
      );
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `${OUT_DIR}/${preset}-${mode}.png`,
        fullPage: true,
      });
    });
  }
}
