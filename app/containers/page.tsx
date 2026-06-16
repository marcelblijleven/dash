import { unauthorized } from "next/navigation";
import { ContainerTable } from "@/components/container-table";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/current-user";
import type { WidgetConfig } from "@/lib/config/schema";
import { isHealthy, listContainers } from "@/lib/docker";
import {
  HostLoadWidget,
  HostMemoryWidget,
  HostUptimeWidget,
} from "@/lib/widgets/host-stat";

export default async function ContainerOverviewPage() {
  const user = await requireUser();
  if (!user) {
    unauthorized();
  }
  const containers = await listContainers().catch(() => []);

  const running = containers.filter((c) => c.State === "running");
  const unhealthy = running.filter((c) => !isHealthy(c)).length;

  const hostUptimeConfig: WidgetConfig = {
    id: "overview-host-uptime",
    type: "host-uptime",
    size: "small",
    title: "Host uptime",
  };
  const hostMemoryConfig: WidgetConfig = {
    id: "overview-host-memory",
    type: "host-memory",
    size: "small",
    title: "Host memory",
  };
  const hostLoadConfig: WidgetConfig = {
    id: "overview-host-load",
    type: "host-load",
    size: "small",
    title: "Host load",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Containers</h1>
        <p className="text-sm text-muted-foreground">
          List of docker containers
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Containers"
          value={`${running.length} / ${containers.length}`}
          hint={`${unhealthy} unhealthy`}
        />
        <HostUptimeWidget config={hostUptimeConfig} />
        <HostMemoryWidget config={hostMemoryConfig} />
        <HostLoadWidget config={hostLoadConfig} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Containers</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {containers.length} total
          </span>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {containers.length === 0 ? (
            <div className="px-5 pb-5 text-sm text-muted-foreground">
              No containers, or the socket proxy is unreachable. Check{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                docker.proxy_url
              </code>{" "}
              in{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                config.yml
              </code>
              .
            </div>
          ) : (
            <ContainerTable containers={containers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
