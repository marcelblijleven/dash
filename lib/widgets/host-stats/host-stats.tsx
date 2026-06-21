import type { WidgetConfig } from "@/lib/config/schema";
import { getHostStats } from "@/lib/host";
import { HostStatsLive } from "./host-stats-live";

export async function HostStatsWidget({ config }: { config: WidgetConfig }) {
  const host = await getHostStats();
  const initial = {
    uptime: host?.uptime ?? null,
    loadAvg: host?.loadAvg ?? null,
    memTotal: host?.memTotal ?? null,
    memAvailable: host?.memAvailable ?? null,
    ncpu: null,
  };

  return <HostStatsLive title={config.title ?? "Host"} initial={initial} />;
}
