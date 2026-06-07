import type { WidgetConfig } from "@/lib/config/schema";
import { getHostStats } from "@/lib/host";
import { getHostSamples } from "@/lib/metrics";
import { HostChartLive, type HostChartMetric } from "./host-chart-live";

type HostChartConfig = WidgetConfig & {
  metric?: HostChartMetric;
};

export async function HostChartWidget({ config }: { config: HostChartConfig }) {
  const metric: HostChartMetric =
    config.metric === "memory" ? "memory" : "load";
  const host = await getHostStats();

  return (
    <HostChartLive
      metric={metric}
      title={
        config.title ?? (metric === "memory" ? "Host memory" : "Host load")
      }
      initial={{
        loadAvg: host?.loadAvg ?? null,
        memTotal: host?.memTotal ?? null,
        memAvailable: host?.memAvailable ?? null,
        ncpu: null,
        samples: getHostSamples(),
      }}
    />
  );
}
