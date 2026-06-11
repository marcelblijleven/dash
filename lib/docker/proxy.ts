import type { Container, ContainerInspect, ContainerStats } from "./types";
import { proxyUrl } from "./utils";

export function listContainers() {
  return dockerGet<Container[]>("/containers/json?all=true");
}

export function inspectContainer(id: string) {
  return dockerGet<ContainerInspect>(`/containers/${id}/json`);
}

export function getContainerStats(
  id: string,
  { oneShot = true }: { oneShot?: boolean } = {},
) {
  const query = oneShot ? "stream=false&one-shot=true" : "stream=false";
  return dockerGet<ContainerStats>(`/containers/${id}/stats?${query}`);
}

export function isHealthy(container: Container): boolean {
  if (container.State !== "running") {
    return false;
  }

  return !container.Status.includes("(unhealthy)");
}

export async function getContainerLogs(
  id: string,
  tail = 200,
  timestamps = 0,
): Promise<string | null> {
  const base = await proxyUrl();
  const res = await fetch(
    `${base}/containers/${id}/logs?stdout=1&stderr=1&tail=${tail}&timestamps=${timestamps}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    },
  );

  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) throw new Error(`docker logs ${id}: ${res.status}`);

  const buf = new Uint8Array(await res.arrayBuffer());

  return prepareDockerLogs(buf);
}

export function containerName(c: Container): string {
  return c.Names[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12);
}

export function cpuPercentage(s: ContainerStats): number {
  const cur = s.cpu_stats?.cpu_usage?.total_usage;
  const prev = s.precpu_stats?.cpu_usage?.total_usage;
  const cursys = s.cpu_stats?.system_cpu_usage;
  const prevsys = s.precpu_stats?.system_cpu_usage;
  if (
    cur === undefined ||
    prev === undefined ||
    cursys === undefined ||
    prevsys === undefined
  ) {
    return 0;
  }
  const cpudelta = cur - prev;
  const sysdelta = cursys - prevsys;
  const numcpus =
    s.cpu_stats?.online_cpus ??
    s.cpu_stats?.cpu_usage?.percpu_usage?.length ??
    1;
  if (sysdelta <= 0 || cpudelta <= 0) return 0;
  return (cpudelta / sysdelta) * numcpus * 100;
}

// Docker's log stream is multiplexed for non-TTY containers. each chunk is an
// 8-byte header (stream type, 3 zero bytes, 4-byte big-endian size) followed
// by the payload. TTY containers stream plain text. Detect and handle both.
function prepareDockerLogs(buf: Uint8Array): string {
  const looksMultiplexed =
    buf.length >= 8 &&
    [0, 1, 2].includes(buf[0]) &&
    buf[1] === 0 &&
    buf[2] === 0 &&
    buf[3] === 0;
  if (!looksMultiplexed) return new TextDecoder().decode(buf);

  const td = new TextDecoder();
  const out: string[] = [];
  let i = 0;
  while (i + 8 <= buf.length) {
    const size =
      (buf[i + 4] << 24) | (buf[i + 5] << 16) | (buf[i + 6] << 8) | buf[i + 7];
    i += 8;
    if (i + size > buf.length) break;
    out.push(td.decode(buf.subarray(i, i + size)));
    i += size;
  }
  return out.join("");
}

export function getNetworkStats(stats: ContainerStats | null): {
  rx: number;
  tx: number;
} {
  if (stats === null) {
    return { rx: 0, tx: 0 };
  }
  const net = stats.networks
    ? Object.values(stats.networks).reduce(
        (acc, n) => ({
          rx: acc.rx + (n.rx_bytes ?? 0),
          tx: acc.tx + (n.tx_bytes ?? 0),
        }),
        { rx: 0, tx: 0 },
      )
    : { rx: 0, tx: 0 };
  return net;
}

async function dockerGet<T>(path: string): Promise<T> {
  const base = await proxyUrl();
  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`docker proxy ${path}: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
