import { type DnsConnection, defaultDnsTitle } from "@/lib/dns/client";
import { DNS_PROVIDERS } from "@/lib/dns/types";
import type { WidgetConfig } from "@/lib/config/schema";

export type DnsWidgetConfig = WidgetConfig & {
  provider?: string;
  url?: string;
  username?: string;
  password?: string;
};

const PROVIDER_SET = new Set<string>(DNS_PROVIDERS);

export function resolveDnsConfig(
  config: DnsWidgetConfig,
): { connection: DnsConnection } | { error: string } {
  if (!config.provider) {
    return { error: "provider is required (pihole | adguard)" };
  }
  if (!PROVIDER_SET.has(config.provider)) {
    return {
      error: `unknown provider "${config.provider}"; expected one of: ${DNS_PROVIDERS.join(", ")}`,
    };
  }
  if (!config.url) {
    return { error: "url is required" };
  }

  if (config.provider === "pihole") {
    return {
      connection: {
        provider: "pihole",
        url: config.url,
        password: config.password ? String(config.password) : undefined,
      },
    };
  }

  // adguard
  if (!config.username || !config.password) {
    return { error: "username and password are required for adguard" };
  }
  return {
    connection: {
      provider: "adguard",
      url: config.url,
      username: config.username,
      password: String(config.password),
    },
  };
}

export { defaultDnsTitle };
