import { WidgetCard } from "@/components/widget-card";
import type { WidgetConfig } from "@/lib/config/schema";

export async function HostStatsWidget({ config }: { config: WidgetConfig }) {
  const initial = {
    uptime: 0,
    loadAvg: 0,
    memTotal: 0,
    memAvailable: 0,
    ncpu: 0,
  };

  return (
    <WidgetCard title={config.title ?? "Host"}>
      {JSON.stringify(initial)}
    </WidgetCard>
  );
}
