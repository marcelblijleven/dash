import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
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

let cache: LoadResult | null = null;
let watcherAttached = false;

function attachWatcher() {
  if (watcherAttached) return;
  try {
    watch(CONFIG_PATH, { persistent: false }, () => {
      cache = null;
    });
    watcherAttached = true;
  } catch {
    // File doesn't exist yet, retry next loadConfig()
  }
}

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

export async function loadConfig(): Promise<LoadResult> {
  if (cache) return cache;
  attachWatcher();

  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = parse(raw);
    cache = {
      config: loadFromParsed(parsed),
      error: null,
      source: CONFIG_PATH,
    };
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      cache = { config: DEFAULTS, error: null, source: CONFIG_PATH };
    } else if (err.code === "EISDIR") {
      cache = {
        config: DEFAULTS,
        error: `${CONFIG_PATH} is a directory, not a file. The host path was missing when the container started, so Docker created a directory. Create config.yml on the host first, then restart the container.`,
        source: CONFIG_PATH,
      };
    } else if (e instanceof z.ZodError) {
      cache = {
        config: DEFAULTS,
        error: e.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; "),
        source: CONFIG_PATH,
      };
    } else {
      cache = {
        config: DEFAULTS,
        error: err.message ?? "failed to parse config.yml",
        source: CONFIG_PATH,
      };
    }

    if (cache.error) {
      console.error(`[dash:config] ${cache.source}: ${cache.error}`);
    }
  }

  console.log(cache);
  return cache;
}
