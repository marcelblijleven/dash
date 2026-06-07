import { WidgetCard } from "@/components/widget-card";
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
    ncpu: 0, // TODO: get info from docker?
  };

  return (
    <WidgetCard title={config.title ?? "Host"}>
      <HostStatsLive initial={initial} />
    </WidgetCard>
  );
}
