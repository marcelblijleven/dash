import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/{screenshots,docs-images}.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "/tmp/dash-screenshot-report", open: "never" }],
  ],
  globalSetup: "./e2e/screenshot-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "off",
    screenshot: "off",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Uses production build to avoid conflicting with any running dev server.
    // Run `pnpm build` before taking screenshots if the app has changed.
    command: `pnpm exec next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 60_000,
    env: {
      DASH_CONFIG: "./config/config.screenshot.yml",
      DASH_PROC_ROOT: ".dev/proc",
    },
  },
});
