import { unauthorized } from "next/navigation";
import { SearchableApps } from "@/components/searchable-apps";
import { WidgetGrid } from "@/components/widget-grid";
import { requireUser } from "@/lib/auth/current-user";
import { type LoadResult, loadConfig } from "@/lib/config/loader";
import { configAppsToEntries, parseDashEntries } from "@/lib/dash";
import { type Container, listContainers } from "@/lib/docker";
import { listRouters, type Router } from "@/lib/traefik";

export const dynamic = "force-dynamic";

function getResultValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === "fulfilled") {
    return result.value as T;
  }

  return fallback;
}

export default async function HomePage() {
  const user = await requireUser();
  if (!user) {
    unauthorized();
  }
  const [containersResult, routersResult, configResult] =
    await Promise.allSettled([listContainers(), listRouters(), loadConfig()]);

  const containers = getResultValue<Container[]>(containersResult, []);
  const routers = getResultValue<Router[]>(routersResult, []);
  const config = getResultValue<LoadResult | null>(configResult, null);
  const configApps = config?.config.apps || [];

  const entries = [
    ...parseDashEntries(containers, routers),
    ...configAppsToEntries(configApps),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <WidgetGrid />
      <SearchableApps entries={entries} />
    </div>
  );
}
