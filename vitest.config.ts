import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e", "tests/e2e"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["app/**", "components/**", "lib/**"],
      exclude: [
        "**/*.d.ts",
        "**/*.{test,spec}.{ts,tsx}",
        "**/types.ts",
        "app/**/layout.tsx",
        "app/**/not-found.tsx",
        "app/**/loading.tsx",
        "app/**/error.tsx",
      ],
    },
  },
});
