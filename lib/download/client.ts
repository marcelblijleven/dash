import type {
  DownloadClientKind,
  DownloadItem,
  DownloadSnapshot,
} from "./types";

const FETCH_TIMEOUT_MS = 10_000;
const MB = 1024 * 1024;
// qBittorrent reports this sentinel for torrents with no meaningful ETA.
const QBIT_ETA_INFINITY = 8640000;

export type DownloadConnection =
  | { client: "qbittorrent"; url: string; username?: string; password?: string }
  | { client: "sabnzbd"; url: string; apiKey: string }
  | { client: "nzbget"; url: string; username?: string; password?: string };

function trimTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
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

// SABnzbd/qBittorrent string ETAs come as "H:MM:SS", "M:SS", or "0:16:44".
export function parseColonTime(value: string | undefined): number | null {
  if (!value) return null;
  const parts = value.split(":").map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

export async function getDownloadSnapshot(
  conn: DownloadConnection,
  signal?: AbortSignal,
): Promise<DownloadSnapshot> {
  switch (conn.client) {
    case "qbittorrent":
      return getQbittorrent(conn, signal);
    case "sabnzbd":
      return getSabnzbd(conn, signal);
    case "nzbget":
      return getNzbget(conn, signal);
  }
}

// ---- qBittorrent ----

type QbitTransfer = { dl_info_speed?: number; up_info_speed?: number };
type QbitTorrent = {
  hash?: string;
  name?: string;
  progress?: number;
  total_size?: number;
  eta?: number;
  state?: string;
};

async function getQbittorrent(
  conn: Extract<DownloadConnection, { client: "qbittorrent" }>,
  signal?: AbortSignal,
): Promise<DownloadSnapshot> {
  const base = trimTrailingSlash(conn.url);
  const { signal: timed, done } = withTimeout(signal);
  try {
    let cookie: string | null = null;
    // Auth is optional: some setups bypass it for trusted networks.
    if (conn.username) {
      const body = new URLSearchParams({
        username: conn.username,
        password: conn.password ?? "",
      });
      const loginRes = await fetch(`${base}/api/v2/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: base,
        },
        body,
        signal: timed,
        cache: "no-store",
      });
      if (!loginRes.ok) {
        throw new Error(
          `qbittorrent login → ${loginRes.status} ${loginRes.statusText}`,
        );
      }
      const setCookie = loginRes.headers.get("set-cookie");
      const match = setCookie?.match(/SID=[^;]+/);
      if (match) cookie = match[0];
    }

    const headers = cookie ? { Cookie: cookie } : undefined;
    const [transfer, torrents] = await Promise.all([
      qbitGet<QbitTransfer>(base, "/api/v2/transfer/info", headers, timed),
      qbitGet<QbitTorrent[]>(
        base,
        "/api/v2/torrents/info?filter=downloading",
        headers,
        timed,
      ),
    ]);

    const items: DownloadItem[] = torrents.map((t) => ({
      id: t.hash ?? t.name ?? "unknown",
      name: t.name ?? "Unknown",
      progress: clampProgress(t.progress ?? 0),
      sizeBytes: t.total_size ?? 0,
      etaSeconds:
        t.eta === undefined || t.eta >= QBIT_ETA_INFINITY ? null : t.eta,
      state: t.state ?? "unknown",
    }));

    return {
      client: "qbittorrent",
      downloadSpeed: transfer.dl_info_speed ?? 0,
      uploadSpeed: transfer.up_info_speed ?? 0,
      activeCount: items.length,
      items,
    };
  } finally {
    done();
  }
}

async function qbitGet<T>(
  base: string,
  path: string,
  headers: Record<string, string> | undefined,
  signal: AbortSignal,
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers,
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`qbittorrent ${path} → ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// ---- SABnzbd ----

type SabSlot = {
  nzo_id?: string;
  filename?: string;
  percentage?: string;
  mb?: string;
  status?: string;
  timeleft?: string;
};
type SabQueue = {
  queue?: {
    kbpersec?: string;
    noofslots?: number;
    slots?: SabSlot[];
  };
};

async function getSabnzbd(
  conn: Extract<DownloadConnection, { client: "sabnzbd" }>,
  signal?: AbortSignal,
): Promise<DownloadSnapshot> {
  const base = trimTrailingSlash(conn.url);
  const { signal: timed, done } = withTimeout(signal);
  try {
    const url = `${base}/api?mode=queue&output=json&apikey=${encodeURIComponent(conn.apiKey)}`;
    const res = await fetch(url, { signal: timed, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`sabnzbd queue → ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as SabQueue;
    const queue = data.queue ?? {};
    const slots = queue.slots ?? [];

    const items: DownloadItem[] = slots.map((s) => ({
      id: s.nzo_id ?? s.filename ?? "unknown",
      name: s.filename ?? "Unknown",
      progress: clampProgress((Number(s.percentage) || 0) / 100),
      sizeBytes: (Number(s.mb) || 0) * MB,
      etaSeconds: parseColonTime(s.timeleft),
      state: s.status ?? "unknown",
    }));

    return {
      client: "sabnzbd",
      downloadSpeed: (Number(queue.kbpersec) || 0) * 1024,
      uploadSpeed: null,
      activeCount: queue.noofslots ?? slots.length,
      items,
    };
  } finally {
    done();
  }
}

// ---- NZBGet ----

type NzbStatus = { result?: { DownloadRate?: number } };
type NzbGroup = {
  NZBID?: number;
  NZBName?: string;
  FileSizeLo?: number;
  FileSizeHi?: number;
  RemainingSizeLo?: number;
  RemainingSizeHi?: number;
  Status?: string;
};
type NzbGroups = { result?: NzbGroup[] };

function combine64(lo: number | undefined, hi: number | undefined): number {
  return (lo ?? 0) + (hi ?? 0) * 2 ** 32;
}

async function getNzbget(
  conn: Extract<DownloadConnection, { client: "nzbget" }>,
  signal?: AbortSignal,
): Promise<DownloadSnapshot> {
  const base = trimTrailingSlash(conn.url);
  const { signal: timed, done } = withTimeout(signal);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (conn.username) {
    const basic = Buffer.from(
      `${conn.username}:${conn.password ?? ""}`,
    ).toString("base64");
    headers.Authorization = `Basic ${basic}`;
  }

  const call = async <T>(method: string, params: unknown[]): Promise<T> => {
    const res = await fetch(`${base}/jsonrpc`, {
      method: "POST",
      headers,
      body: JSON.stringify({ method, params, id: 1, jsonrpc: "2.0" }),
      signal: timed,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`nzbget ${method} → ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  };

  try {
    const [status, groups] = await Promise.all([
      call<NzbStatus>("status", []),
      call<NzbGroups>("listgroups", [0]),
    ]);

    const rate = status.result?.DownloadRate ?? 0;
    const items: DownloadItem[] = (groups.result ?? []).map((g) => {
      const total = combine64(g.FileSizeLo, g.FileSizeHi);
      const remaining = combine64(g.RemainingSizeLo, g.RemainingSizeHi);
      const downloaded = Math.max(0, total - remaining);
      return {
        id: String(g.NZBID ?? g.NZBName ?? "unknown"),
        name: g.NZBName ?? "Unknown",
        progress: total > 0 ? clampProgress(downloaded / total) : 0,
        sizeBytes: total,
        etaSeconds: rate > 0 ? Math.round(remaining / rate) : null,
        state: g.Status ?? "unknown",
      };
    });

    return {
      client: "nzbget",
      downloadSpeed: rate,
      uploadSpeed: null,
      activeCount: items.length,
      items,
    };
  } finally {
    done();
  }
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function defaultDownloadTitle(client: DownloadClientKind): string {
  switch (client) {
    case "qbittorrent":
      return "qBittorrent";
    case "sabnzbd":
      return "SABnzbd";
    case "nzbget":
      return "NZBGet";
  }
}
