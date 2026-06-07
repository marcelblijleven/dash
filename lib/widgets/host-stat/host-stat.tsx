import type { WidgetConfig } from "@/lib/config/schema";
import { getHostStats } from "@/lib/host";
import { HostStatCard } from "./host-stat-card";

export async function HostMemoryWidget({ config }: { config: WidgetConfig }) {
  const host = await getHostStats();

  return (
    <HostStatCard
      field="memory"
      title={config.title ?? "Host memory"}
      initial={{
        uptime: host?.uptime ?? null,
        loadAvg: host?.loadAvg ?? null,
        memTotal: host?.memTotal ?? null,
        memAvailable: host?.memAvailable ?? null,
        ncpu: null,
      }}
    />
  );
}

export async function HostLoadWidget({ config }: { config: WidgetConfig }) {
  const host = await getHostStats();

  return (
    <HostStatCard
      field="load"
      title={config.title ?? "Host load"}
      initial={{
        uptime: host?.uptime ?? null,
        loadAvg: host?.loadAvg ?? null,
        memTotal: host?.memTotal ?? null,
        memAvailable: host?.memAvailable ?? null,
        ncpu: null,
      }}
    />
  );
}

export async function HostUptimeWidget({ config }: { config: WidgetConfig }) {
  const host = await getHostStats();

  return (
    <HostStatCard
      field="uptime"
      title={config.title ?? "Host uptime"}
      initial={{
        uptime: host?.uptime ?? null,
        loadAvg: host?.loadAvg ?? null,
        memTotal: host?.memTotal ?? null,
        memAvailable: host?.memAvailable ?? null,
        ncpu: null,
      }}
    />
  );
}
