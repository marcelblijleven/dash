import { readFile } from "node:fs/promises";
import { cache } from "react";
import { parse } from "yaml";
import { z } from "zod";

import {
  ConfigSchema,
  type DashConfig,
  type WidgetConfig,
  type WidgetSchema,
} from "@/lib/config/schema";

const CONFIG_PATH = process.env.DASH_CONFIG ?? "/config/config.yml";

export type LoadResult = {
  config: DashConfig;
  error: string | null;
  source: string;
};

// Replace ${ENV_VAR} occurrences with process.env values. Missing vars become
// empty strings so stale interpolations don't crash the dashboard.
function interpolate(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\$\{(\w+)\}/g, (_, k) => process.env[k] ?? "");
  }
  if (Array.isArray(value)) return value.map(interpolate);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = interpolate(v);
    }
    return out;
  }
  return value;
}

function withWidgetIds(
  widgets: z.infer<typeof WidgetSchema>[],
): WidgetConfig[] {
  return widgets.map((w, i) => ({ ...w, id: `${w.type}-${i}` }));
}

function loadFromParsed(parsed: unknown): DashConfig {
  const interp = interpolate(parsed);
  const validated = ConfigSchema.parse(interp ?? {});
  return { ...validated, widgets: withWidgetIds(validated.widgets) };
}

// Built-in defaults: what you get with no config file mounted at all.
export const DEFAULTS: DashConfig = loadFromParsed({});

async function readConfig(): Promise<LoadResult> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = parse(raw);
    return {
      config: loadFromParsed(parsed),
      error: null,
      source: CONFIG_PATH,
    };
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    let error: string | null = null;

    if (err.code === "ENOENT") {
      return { config: DEFAULTS, error: null, source: CONFIG_PATH };
    }
    if (err.code === "EISDIR") {
      error = `${CONFIG_PATH} is a directory, not a file. The host path was missing when the container started, so Docker created a directory. Create config.yml on the host first, then restart the container.`;
    } else if (e instanceof z.ZodError) {
      error = e.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
    } else {
      error = err.message ?? "failed to parse config.yml";
    }

    console.error(`[dash:config] ${CONFIG_PATH}: ${error}`);
    return { config: DEFAULTS, error, source: CONFIG_PATH };
  }
}

// React's cache() dedupes calls within a single request without retaining
// state across requests, so config edits are reflected on the next reload.
export const loadConfig = cache(readConfig);
