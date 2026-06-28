import type { WidgetConfig } from "@/lib/config/schema";
import {
  type DownloadConnection,
  defaultDownloadTitle,
} from "@/lib/download/client";
import { DOWNLOAD_CLIENTS } from "@/lib/download/types";

export type DownloadWidgetConfig = WidgetConfig & {
  client?: string;
  url?: string;
  username?: string;
  password?: string;
  api_key?: string;
  limit?: number;
};

export const DEFAULT_DOWNLOAD_LIMIT = 5;
const LIMIT_MIN = 1;
const LIMIT_MAX = 50;

const CLIENT_SET = new Set<string>(DOWNLOAD_CLIENTS);

export function clampLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_DOWNLOAD_LIMIT;
  }
  return Math.max(LIMIT_MIN, Math.min(LIMIT_MAX, Math.floor(value)));
}

export function resolveDownloadConfig(
  config: DownloadWidgetConfig,
): { connection: DownloadConnection } | { error: string } {
  if (!config.client) {
    return { error: "client is required (qbittorrent | sabnzbd | nzbget)" };
  }
  if (!CLIENT_SET.has(config.client)) {
    return {
      error: `unknown client "${config.client}"; expected one of: ${DOWNLOAD_CLIENTS.join(", ")}`,
    };
  }
  if (!config.url) {
    return { error: "url is required" };
  }

  if (config.client === "sabnzbd") {
    if (!config.api_key) {
      return { error: "api_key is required for sabnzbd" };
    }
    return {
      connection: {
        client: "sabnzbd",
        url: config.url,
        apiKey: String(config.api_key),
      },
    };
  }

  if (config.client === "qbittorrent") {
    return {
      connection: {
        client: "qbittorrent",
        url: config.url,
        username: config.username,
        password: config.password ? String(config.password) : undefined,
      },
    };
  }

  // nzbget
  return {
    connection: {
      client: "nzbget",
      url: config.url,
      username: config.username,
      password: config.password ? String(config.password) : undefined,
    },
  };
}

export { defaultDownloadTitle };
