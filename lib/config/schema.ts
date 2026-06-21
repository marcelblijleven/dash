import { z } from "zod";

import { WIDGET_TYPES } from "@/lib/widgets/types";

export type WidgetSize = "small" | "medium" | "large";

export const WidgetSchema = z
  .object({
    type: z
      .enum([WIDGET_TYPES[0], ...WIDGET_TYPES.slice(1)] as [
        string,
        ...string[],
      ])
      .describe(
        "Widget type, determines which fields are valid for each widget.",
      ),
    title: z.string().optional(),
    size: z.enum(["small", "medium", "large"]).default("medium"),
  })
  .loose();

export type WidgetConfig = z.infer<typeof WidgetSchema> & {
  id: string;
  [key: string]: unknown;
};

export type DashConfig = Omit<z.infer<typeof ConfigSchema>, "widgets"> & {
  widgets: WidgetConfig[];
};

const DockerSchema = z
  .object({
    proxy_url: z
      .string()
      .describe("URL of your docker-socket-proxy")
      .default("http://dockersocket:2375"),
  })
  .prefault({});

const TraefikSchema = z
  .object({
    api_url: z
      .string()
      .describe("Traefik API URL (must be reachable from dash)")
      .default("http://traefik:8080"),
  })
  .prefault({});

// Passwords commonly contain characters that YAML parses as non-strings
// (e.g. unquoted "12345" becomes a number, "yes" becomes a boolean). Coerce
// to string so an unquoted password still works, then enforce non-empty.
const PasswordField = z.preprocess(
  (v) => (v == null ? v : String(v)),
  z.string().min(1, "password is required and must be non-empty"),
);

const TeslamatePostgresSchema = z
  .object({
    host: z.string().describe("TeslaMate Postgres host"),
    port: z.number().int().positive().default(5432),
    database: z.string().default("teslamate"),
    user: z.string().default("teslamate"),
    password: PasswordField,
    ssl: z.boolean().default(false),
  })
  .optional();

const TeslamateMqttSchema = z
  .object({
    url: z
      .string()
      .describe("MQTT broker URL (e.g. mqtt://mosquitto:1883)"),
    username: z.string().optional(),
    password: PasswordField.optional(),
    topic_prefix: z
      .string()
      .describe("Topic prefix TeslaMate publishes under")
      .default("teslamate"),
  })
  .optional();

const TeslamateSchema = z
  .object({
    mqtt: TeslamateMqttSchema,
    postgres: TeslamatePostgresSchema,
  })
  .prefault({});

export const THEME_PRESETS = [
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
export type ThemePreset = (typeof THEME_PRESETS)[number];

export const THEME_GLASS_LEVELS = [
  "none",
  "subtle",
  "regular",
  "clear",
] as const;
export type ThemeGlass = (typeof THEME_GLASS_LEVELS)[number];

const ThemeSchema = z
  .object({
    preset: z
      .enum(THEME_PRESETS)
      .describe("Built-in palette. Defaults to 'orange'.")
      .optional(),
    primary: z
      .string()
      .min(1, "primary must be a non-empty CSS color")
      .describe(
        "Custom accent color (any CSS color: hex, rgb(), oklch(), ...). Overrides the preset.",
      )
      .optional(),
    glass: z
      .enum(THEME_GLASS_LEVELS)
      .describe(
        "Card glassiness. 'none' is solid (default). 'subtle' adds a light blur; 'regular' matches the Apple 'Regular' liquid-glass feel; 'clear' is the most transparent.",
      )
      .optional(),
  })
  .prefault({});

const ShortCutSchema = z.object({
  name: z.string(),
  path: z.string(),
  icon: z.string().optional(),
});

const AppSchema = z.object({
  title: z.string().describe("Display name and search key"),
  url: z.string().describe("Launch URL"),
  "local-url": z
    .string()
    .optional()
    .describe("Local network URL, used when on the same network"),
  icon: z
    .string()
    .optional()
    .describe("Icon name from selfh.st/icons or a full URL"),
  category: z.string().optional().describe("Category for grouping"),
  description: z.string().optional(),
  shortcuts: z.array(ShortCutSchema).default([]),
});

export const ConfigSchema = z.object({
  docker: DockerSchema,
  traefik: TraefikSchema,
  teslamate: TeslamateSchema,
  theme: ThemeSchema,
  widgets: z.array(WidgetSchema).default([]),
  apps: z.array(AppSchema).default([]),
});

export function configJsonSchema() {
  return z.toJSONSchema(ConfigSchema, {
    target: "draft-2020-12",
    metadata: z.globalRegistry,
    io: "input",
  });
}
