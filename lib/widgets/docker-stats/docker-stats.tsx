import type { WidgetConfig } from "@/lib/config/schema";
import { isHealthy, listContainers } from "@/lib/docker";
import { DockerStatsLive, type DockerStatsData } from "./docker-stats-live";

export async function getDockerStats(): Promise<DockerStatsData> {
  const containers = await listContainers().catch(() => []);
  const running = containers.filter((c) => c.State === "running");
  const unhealthy = running.filter((c) => !isHealthy(c)).length;
  return { total: containers.length, running: running.length, unhealthy };
}

export async function DockerStatsWidget({ config }: { config: WidgetConfig }) {
  const initial = await getDockerStats().catch(() => null);
  return <DockerStatsLive title={config.title ?? "Docker"} initial={initial} />;
}
