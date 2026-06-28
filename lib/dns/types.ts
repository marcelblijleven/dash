export const DNS_PROVIDERS = ["pihole", "adguard"] as const;

export type DnsProvider = (typeof DNS_PROVIDERS)[number];

export type DnsStatsSnapshot = {
  provider: DnsProvider;
  totalQueries: number;
  blocked: number;
  blockedPercent: number;
  domainsBlocked: number | null;
};
