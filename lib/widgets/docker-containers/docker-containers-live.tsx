"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/components/ui/status-dot";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import { containerVariant, sortContainers } from "./config";

export type DockerContainerItem = {
  id: string;
  name: string;
  state: string;
  status: string;
  healthy: boolean;
};

export type DockerContainersData = {
  total: number;
  running: number;
  items: DockerContainerItem[];
};

export function DockerContainersLive({
  title,
  initial,
  limit,
}: {
  title: string;
  initial: DockerContainersData | null;
  limit: number;
}) {
  const { data, status, updatedAt } = usePoll<DockerContainersData>(
    "/api/widgets/docker-containers",
    initial,
  );

  const hint = (
    <span className="text-xs text-muted-foreground">
      {status === "ok" ? (
        <RelativeTime since={updatedAt} />
      ) : (
        <span className="text-amber-600 dark:text-amber-400">stale</span>
      )}
    </span>
  );

  return (
    <WidgetCard title={title} hint={hint}>
      {!data ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : (
        <Body data={data} limit={limit} />
      )}
    </WidgetCard>
  );
}

function Body({ data, limit }: { data: DockerContainersData; limit: number }) {
  if (data.items.length === 0) {
    return <div className="text-sm text-muted-foreground">no containers</div>;
  }

  const sorted = sortContainers(data.items);
  const shown = sorted.slice(0, limit);
  const hidden = sorted.length - shown.length;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="tabular-nums text-foreground">{data.running}</span> /{" "}
        {data.total} running
      </div>
      <ul className="divide-y divide-border text-sm">
        {shown.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </ul>
      {hidden > 0 && (
        <div className="text-xs text-muted-foreground">+{hidden} more</div>
      )}
    </div>
  );
}

function Row({ item }: { item: DockerContainerItem }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <StatusDot variant={containerVariant(item)} />
        <span className="truncate font-medium">{item.name}</span>
      </div>
      <span className="shrink-0 truncate text-xs text-muted-foreground">
        {item.status}
      </span>
    </li>
  );
}
