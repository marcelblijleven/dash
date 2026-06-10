import type { Container, ContainerInspect, ContainerStats } from "./types";
import { proxyUrl } from "./utils";

export function listContainers() {
  return dockerGet<Container[]>("/containers/json?all=true");
}

export function inspectContainer(id: string) {
  return dockerGet<ContainerInspect>(`/containers/${id}/json`);
}

export function getContainerStats(id: string) {
  return dockerGet<ContainerStats>(
    `/containers/${id}/stats?stream=false&one-shot=true`,
  );
}

export function isHealthy(container: Container): boolean {
  if (container.State !== "running") {
    return false;
  }

  return !container.Status.includes("(unhealthy)");
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

export function getNetworkStats(stats: ContainerStats): {
  rx: number;
  tx: number;
} {
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
