import type { WidgetConfig } from "@/lib/config/schema";
import { containerName, isHealthy, listContainers } from "@/lib/docker";
import { clampLimit } from "./config";
import {
  DockerContainersLive,
  type DockerContainersData,
} from "./docker-containers-live";

export async function getDockerContainers(): Promise<DockerContainersData> {
  const containers = await listContainers().catch(() => []);
  const items = containers.map((c) => ({
    id: c.Id.slice(0, 12),
    name: containerName(c),
    state: c.State,
    status: c.Status,
    healthy: isHealthy(c),
  }));
  const running = items.filter((i) => i.state === "running").length;
  return { total: items.length, running, items };
}

export async function DockerContainersWidget({
  config,
}: {
  config: WidgetConfig;
}) {
  const limit = clampLimit(config.limit);
  const initial = await getDockerContainers().catch(() => null);
  return (
    <DockerContainersLive
      title={config.title ?? "Containers"}
      initial={initial}
      limit={limit}
    />
  );
}
