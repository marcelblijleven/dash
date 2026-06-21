import { describe, expect, it } from "vitest";
import { ConfigSchema, THEME_PRESETS } from "./schema";

describe("ConfigSchema.theme", () => {
  it("defaults to an empty theme block", () => {
    const parsed = ConfigSchema.parse({});
    expect(parsed.theme).toEqual({});
  });

  it("accepts every built-in preset", () => {
    for (const preset of THEME_PRESETS) {
      const parsed = ConfigSchema.parse({ theme: { preset } });
      expect(parsed.theme.preset).toBe(preset);
    }
  });

  it("rejects an unknown preset", () => {
    expect(() =>
      ConfigSchema.parse({ theme: { preset: "magenta" } }),
    ).toThrow();
  });

  it("passes a primary color string through unchanged", () => {
    const parsed = ConfigSchema.parse({
      theme: { primary: "#ff5733" },
    });
    expect(parsed.theme.primary).toBe("#ff5733");
  });

  it("rejects an empty primary string", () => {
    expect(() => ConfigSchema.parse({ theme: { primary: "" } })).toThrow();
  });

  it("accepts preset and primary together", () => {
    const parsed = ConfigSchema.parse({
      theme: { preset: "blue", primary: "oklch(0.7 0.18 250)" },
    });
    expect(parsed.theme).toEqual({
      preset: "blue",
      primary: "oklch(0.7 0.18 250)",
    });
  });
});
