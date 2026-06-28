import type { WidgetConfig } from "@/lib/config/schema";
import {
  type Container,
  containerName,
  cpuPercentage,
  getContainerStats,
  listContainers,
} from "@/lib/docker";
import { clampLimit, resolveSort } from "./config";
import { DockerTopLive, type DockerTopData } from "./docker-top-live";

// Cap how many stats reads run at once. Each `stream=false` read blocks for
// about a second on the daemon while it samples twice, so unbounded parallel
// reads against a host with many containers would hammer the socket proxy.
const STATS_CONCURRENCY = 6;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

export async function getDockerTop(): Promise<DockerTopData> {
  const containers = await listContainers().catch(() => []);
  const running = containers.filter((c) => c.State === "running");

  const items = await mapWithConcurrency(
    running,
    STATS_CONCURRENCY,
    async (c: Container) => {
      const stats = await getContainerStats(c.Id, { oneShot: false }).catch(
        () => null,
      );
      const memUsed = stats?.memory_stats?.usage ?? 0;
      const memLimit = stats?.memory_stats?.limit ?? 0;
      return {
        id: c.Id.slice(0, 12),
        name: containerName(c),
        cpu: stats ? cpuPercentage(stats) : 0,
        memUsed,
        memLimit,
        memPct: memLimit > 0 ? (memUsed / memLimit) * 100 : 0,
      };
    },
  );

  return { total: running.length, items };
}

export async function DockerTopWidget({ config }: { config: WidgetConfig }) {
  const limit = clampLimit(config.limit);
  const sort = resolveSort(config.sort);
  const initial = await getDockerTop().catch(() => null);
  return (
    <DockerTopLive
      title={config.title ?? "Top containers"}
      initial={initial}
      limit={limit}
      sort={sort}
    />
  );
}
