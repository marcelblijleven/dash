import type { WidgetConfig } from "@/lib/config/schema";
import { ARR_SERVICES, type ArrService } from "@/lib/arr/types";
import type { ArrConnection } from "@/lib/arr/client";

export type ArrWidgetConfig = WidgetConfig & {
  service?: string;
  url?: string;
  api_key?: string;
  limit?: number;
};

export const DEFAULT_ARR_LIMIT = 3;
const ARR_LIMIT_MIN = 1;
const ARR_LIMIT_MAX = 50;

const ARR_SERVICE_SET = new Set<string>(ARR_SERVICES);

export function clampLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_ARR_LIMIT;
  }
  return Math.max(ARR_LIMIT_MIN, Math.min(ARR_LIMIT_MAX, Math.floor(value)));
}

export function resolveArrConfig(
  config: ArrWidgetConfig,
): { connection: ArrConnection } | { error: string } {
  if (!config.service) {
    return { error: "service is required (sonarr | radarr | lidarr | readarr)" };
  }
  if (!ARR_SERVICE_SET.has(config.service)) {
    return {
      error: `unknown service "${config.service}"; expected one of: ${ARR_SERVICES.join(", ")}`,
    };
  }
  if (!config.url) {
    return { error: "url is required" };
  }
  if (!config.api_key) {
    return { error: "api_key is required" };
  }
  return {
    connection: {
      service: config.service as ArrService,
      url: config.url,
      apiKey: String(config.api_key),
    },
  };
}

export function defaultTitle(service: ArrService): string {
  return service.charAt(0).toUpperCase() + service.slice(1);
}
