import type { DnsProvider, DnsStatsSnapshot } from "./types";

const FETCH_TIMEOUT_MS = 10_000;

export type DnsConnection =
  | { provider: "pihole"; url: string; password?: string }
  | { provider: "adguard"; url: string; username: string; password: string };

function trimTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

export function blockedPercent(total: number, blocked: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (blocked / total) * 100));
}

export async function getDnsStats(
  conn: DnsConnection,
  signal?: AbortSignal,
): Promise<DnsStatsSnapshot> {
  if (conn.provider === "pihole") {
    return getPiholeStats(conn, signal);
  }
  return getAdguardStats(conn, signal);
}

function withTimeout(signal?: AbortSignal): {
  signal: AbortSignal;
  done: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const combined = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;
  return { signal: combined, done: () => clearTimeout(timer) };
}

// ---- Pi-hole v6 ----

type PiholeSummary = {
  queries?: { total?: number; blocked?: number };
  gravity?: { domains_being_blocked?: number };
};

async function getPiholeStats(
  conn: Extract<DnsConnection, { provider: "pihole" }>,
  signal?: AbortSignal,
): Promise<DnsStatsSnapshot> {
  const base = trimTrailingSlash(conn.url);
  const { signal: timed, done } = withTimeout(signal);
  let sid: string | null = null;
  try {
    // A password is optional: an unauthenticated Pi-hole returns stats
    // directly. When set, exchange it for a short-lived session id.
    if (conn.password) {
      const authRes = await fetch(`${base}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: conn.password }),
        signal: timed,
        cache: "no-store",
      });
      if (!authRes.ok) {
        throw new Error(
          `pihole auth → ${authRes.status} ${authRes.statusText}`,
        );
      }
      const auth = (await authRes.json()) as {
        session?: { sid?: string | null; valid?: boolean };
      };
      sid = auth.session?.sid ?? null;
    }

    const summaryRes = await fetch(`${base}/api/stats/summary`, {
      headers: sid ? { "X-FTL-SID": sid } : undefined,
      signal: timed,
      cache: "no-store",
    });
    if (!summaryRes.ok) {
      throw new Error(
        `pihole summary → ${summaryRes.status} ${summaryRes.statusText}`,
      );
    }
    const summary = (await summaryRes.json()) as PiholeSummary;
    const total = summary.queries?.total ?? 0;
    const blocked = summary.queries?.blocked ?? 0;
    return {
      provider: "pihole",
      totalQueries: total,
      blocked,
      blockedPercent: blockedPercent(total, blocked),
      domainsBlocked: summary.gravity?.domains_being_blocked ?? null,
    };
  } finally {
    done();
    // Sessions are a limited resource on Pi-hole; release ours so polling
    // doesn't exhaust the pool. Best-effort - ignore failures.
    if (sid) {
      await fetch(`${base}/api/auth`, {
        method: "DELETE",
        headers: { "X-FTL-SID": sid },
        cache: "no-store",
      }).catch(() => {});
    }
  }
}

// ---- AdGuard Home ----

type AdguardStats = {
  num_dns_queries?: number;
  num_blocked_filtering?: number;
};

async function getAdguardStats(
  conn: Extract<DnsConnection, { provider: "adguard" }>,
  signal?: AbortSignal,
): Promise<DnsStatsSnapshot> {
  const base = trimTrailingSlash(conn.url);
  const { signal: timed, done } = withTimeout(signal);
  const basic = Buffer.from(`${conn.username}:${conn.password}`).toString(
    "base64",
  );
  try {
    const res = await fetch(`${base}/control/stats`, {
      headers: { Authorization: `Basic ${basic}` },
      signal: timed,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`adguard stats → ${res.status} ${res.statusText}`);
    }
    const stats = (await res.json()) as AdguardStats;
    const total = stats.num_dns_queries ?? 0;
    const blocked = stats.num_blocked_filtering ?? 0;
    return {
      provider: "adguard",
      totalQueries: total,
      blocked,
      blockedPercent: blockedPercent(total, blocked),
      domainsBlocked: null,
    };
  } finally {
    done();
  }
}

export function defaultDnsTitle(provider: DnsProvider): string {
  return provider === "pihole" ? "Pi-hole" : "AdGuard Home";
}
