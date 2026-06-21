import type { WidgetConfig } from "@/lib/config/schema";
import { listRouters, listServices, serviceHealthy } from "@/lib/traefik";
import {
  TraefikStatusLive,
  type TraefikStatusData,
} from "./traefik-status-live";

export async function getTraefikStatus(): Promise<TraefikStatusData> {
  const [routers, services] = await Promise.all([
    listRouters(),
    listServices(),
  ]);
  const enabledCount = routers.filter((r) => r.status === "enabled").length;
  const servicesDown = services.filter(
    (s) => serviceHealthy(s) === false,
  ).length;
  return {
    routerCount: routers.length,
    enabledCount,
    servicesDown,
  };
}

export async function TraefikStatusWidget({
  config,
}: {
  config: WidgetConfig;
}) {
  const initial = await getTraefikStatus().catch(() => null);
  return (
    <TraefikStatusLive title={config.title ?? "Traefik"} initial={initial} />
  );
}
