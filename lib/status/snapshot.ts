import { loadConfig } from "@/lib/config/loader";
import { configAppsToEntries, parseDashEntries } from "@/lib/dash";
import type { DashEntry } from "@/lib/dash/entries";
import { type Container, listContainers } from "@/lib/docker";
import { listRouters, type Router } from "@/lib/traefik";

export type StatusEntry = {
  id: string;
  name: string;
  category: string;
  icon?: string;
  running: boolean;
  healthy: boolean;
};

export type StatusSnapshot = {
  entries: StatusEntry[];
  generatedAt: number;
};

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

function toStatusEntry(entry: DashEntry): StatusEntry {
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    icon: entry.icon,
    running: entry.running,
    healthy: entry.healthy,
  };
}

export async function getStatusSnapshot(): Promise<StatusSnapshot> {
  const [containersResult, routersResult, configResult] =
    await Promise.allSettled([listContainers(), listRouters(), loadConfig()]);

  const containers = settled<Container[]>(containersResult, []);
  const routers = settled<Router[]>(routersResult, []);
  const configApps =
    configResult.status === "fulfilled"
      ? (configResult.value?.config.apps ?? [])
      : [];

  const entries = [
    ...parseDashEntries(containers, routers),
    ...configAppsToEntries(configApps),
  ]
    .map(toStatusEntry)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { entries, generatedAt: Date.now() };
}
