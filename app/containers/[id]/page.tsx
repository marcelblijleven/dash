import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, unauthorized } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { requireUser } from "@/lib/auth/current-user";
import {
  type ContainerInspect,
  cpuPercentage,
  getContainerLogs,
  getContainerStats,
  getNetworkStats,
  inspectContainer,
  type LiveStatsData,
} from "@/lib/docker";
import { shortId } from "@/lib/utils";
import { ContainerActions } from "./container-actions";
import { LiveStats } from "./live-stats";

export const dynamic = "force-dynamic";

type Variant = "success" | "warning" | "danger" | "neutral";

function stateVariant(state: {
  Running: boolean;
  Health?: { Status: string };
}): Variant {
  if (!state.Running) return "danger";
  if (state.Health?.Status === "unhealthy") return "warning";
  if (state.Health?.Status === "starting") return "warning";
  return "success";
}

export default async function ContainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!user) {
    unauthorized();
  }
  const { id } = await params;

  let inspect: ContainerInspect;
  try {
    inspect = await inspectContainer(id);
  } catch {
    notFound();
  }

  const [statsResult, logsResult] = await Promise.allSettled([
    getContainerStats(id),
    getContainerLogs(id),
  ]);

  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  const logs = logsResult.status === "fulfilled" ? logsResult.value : null;

  const net = getNetworkStats(stats);
  const initial: LiveStatsData | null = stats
    ? {
        cpu: cpuPercentage(stats),
        memUsed: stats.memory_stats?.usage ?? 0,
        memLimit: stats.memory_stats?.limit ?? 0,
        cores: stats.cpu_stats?.online_cpus ?? 1,
        netRx: net.rx,
        netTx: net.tx,
      }
    : null;

  const name = inspect.Name.replace(/^\//, "");
  const labels = Object.entries(inspect.Config.Labels ?? {});
  const variant = stateVariant(inspect.State);
  const command = [inspect.Path, ...inspect.Args].join(" ").trim();
  const started =
    inspect.State.StartedAt &&
    inspect.State.StartedAt !== "0001-01-01T00:00:00Z";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/containers"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Overview
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{name}</h1>
            <Badge variant={variant}>
              <StatusDot variant={variant} />
              {inspect.State.Status}
              {inspect.State.Health && ` · ${inspect.State.Health.Status}`}
            </Badge>
          </div>
          <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
            <span data-sensitive="">{inspect.Config.Image}</span> ·{" "}
            {shortId(inspect.Id)}
          </div>
        </div>
        <ContainerActions id={inspect.Id} running={inspect.State.Running} />
      </div>

      <LiveStats
        id={inspect.Id}
        initial={initial}
        restartCount={inspect.RestartCount}
        restartPolicy={inspect.HostConfig.RestartPolicy.Name}
      />

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border text-sm">
            <Field
              label="Container ID"
              value={
                <code className="break-all font-mono text-xs">
                  {inspect.Id}
                </code>
              }
            />
            <Field
              label="Created"
              value={new Date(inspect.Created).toLocaleString()}
            />
            <Field
              label="Started at"
              value={
                started
                  ? new Date(inspect.State.StartedAt).toLocaleString()
                  : "-"
              }
            />
            <Field
              label="Network mode"
              value={inspect.HostConfig.NetworkMode}
            />
            <Field
              label="Networks"
              value={
                <span data-sensitive="">
                  {Object.keys(inspect.NetworkSettings.Networks).join(", ") ||
                    "-"}
                </span>
              }
            />
            <Field
              label="Command"
              value={
                command ? (
                  <code
                    className="font-mono text-xs break-all"
                    data-sensitive=""
                  >
                    {command}
                  </code>
                ) : (
                  "-"
                )
              }
            />
          </dl>
        </CardContent>
      </Card>

      {inspect.Mounts.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Mounts</CardTitle>
            <span className="text-xs text-muted-foreground">
              {inspect.Mounts.length}
            </span>
          </CardHeader>
          <CardContent className="font-mono text-xs">
            <div className="space-y-1">
              {inspect.Mounts.map((m) => (
                <div
                  key={`${m.Source}:${m.Destination}`}
                  className="grid grid-cols-[60px_1fr] gap-3"
                >
                  <span className="text-muted-foreground">{m.Type}</span>
                  <span className="break-all" data-sensitive="">
                    {m.Source} <span className="text-muted-foreground">→</span>{" "}
                    {m.Destination}
                    {!m.RW && (
                      <span className="ml-2 text-muted-foreground">(ro)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {labels.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Labels</CardTitle>
            <span className="text-xs text-muted-foreground">
              {labels.length}
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid max-h-80 gap-2 overflow-auto font-mono text-xs sm:gap-1.5">
              {labels.map(([k, v]) => (
                <div
                  key={k}
                  className="grid grid-cols-1 gap-0.5 sm:grid-cols-[max-content_1fr] sm:gap-3"
                >
                  <span className="break-all text-muted-foreground">{k}</span>
                  <span className="break-all" data-sensitive="">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Logs</CardTitle>
          <span className="text-xs text-muted-foreground">last 200 lines</span>
        </CardHeader>
        <CardContent>
          {logs === null ? (
            <p className="text-sm text-muted-foreground">
              Logs are not permitted by the socket proxy. Set{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                LOGS=1
              </code>{" "}
              on the proxy to enable.
            </p>
          ) : !logs.trim() ? (
            <p className="text-sm text-muted-foreground">No log output.</p>
          ) : (
            <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
              {logs}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-muted-foreground sm:shrink-0">{label}</dt>
      <dd className="min-w-0 text-left sm:text-right">{value}</dd>
    </div>
  );
}
