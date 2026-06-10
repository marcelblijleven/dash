import { loadConfig } from "@/lib/config/loader";

async function proxyUrl(): Promise<string> {
  const { config } = await loadConfig();
  return config.docker.proxy_url;
}

export type Port = {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: string;
};

export type Container = {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Created: number;
  State: string;
  Status: string;
  Labels: Record<string, string>;
  Ports?: Port[];
};

export type ContainerInspect = {
  Id: string;
  Created: string;
  Path: string;
  Args: string[];
  Image: string;
  Name: string;
  RestartCount: number;
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    StartedAt: string;
    FinishedAt: string;
    ExitCode: number;
    Health?: { Status: string; FailingStreak: number };
  };
  Config: {
    Image: string;
    Cmd?: string[] | null;
    Labels: Record<string, string>;
    WorkingDir: string;
    User: string;
  };
  HostConfig: {
    NetworkMode: string;
    RestartPolicy: { Name: string; MaximumRetryCount: number };
  };
  Mounts: Array<{
    Type: string;
    Source: string;
    Destination: string;
    Mode: string;
    RW: boolean;
    Name?: string;
  }>;
  NetworkSettings: {
    Networks: Record<
      string,
      { IPAddress: string; Gatetway: string; MacAddress: string }
    >;
  };
};

export type ContainerStats = {
  cpu_stats?: {
    cpu_usage?: { total_usage?: number; percpu_usage?: number[] };
    system_cpu_usage?: number;
    online_cpus?: number;
  };
  precpu_stats?: {
    cpu_usage?: { total_usage?: number };
    system_cpu_usage?: number;
  };
  memory_stats?: { usage?: number; limit?: number };
  networks?: Record<string, { rx_bytes: number; tx_bytes: number }>;
};

export type LiveStatsData = {
  cpu: number;
  memUsed: number;
  memLimit: number;
  cores: number;
  netRx: number;
  netTx: number;
};

type LiveStatsListener = (stats: LiveStatsData) => void;

declare global {
  var __dashDockerLiveStatsListeners: Set<LiveStatsListener> | undefined;
}

globalThis.__dashDockerLiveStatsListeners ??= new Set();
const liveStatsListener = globalThis.__dashDockerLiveStatsListeners;

export function subribeToDockerStats(listener: LiveStatsListener): () => void {
  liveStatsListener.add(listener);
  return () => {
    liveStatsListener.delete(listener);
  };
}

export function listContainers() {
  return dockerGet<Container[]>("/containers/json?all=true");
}

export function inspectContainer(id: string) {
  return dockerGet<ContainerInspect>(`/container/${id}/json`);
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
