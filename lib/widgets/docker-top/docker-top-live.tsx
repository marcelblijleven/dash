"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import { type SortBy, sortByMetric } from "./config";

export type DockerTopItem = {
  id: string;
  name: string;
  cpu: number;
  memUsed: number;
  memLimit: number;
  memPct: number;
};

export type DockerTopData = {
  total: number;
  items: DockerTopItem[];
};

export function DockerTopLive({
  title,
  initial,
  limit,
  sort,
}: {
  title: string;
  initial: DockerTopData | null;
  limit: number;
  sort: SortBy;
}) {
  const { data, status, updatedAt } = usePoll<DockerTopData>(
    "/api/widgets/docker-top",
    initial,
  );

  const hint = (
    <span className="text-xs text-muted-foreground">
      by {sort} ·{" "}
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
        <div className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : (
        <Body data={data} limit={limit} sort={sort} />
      )}
    </WidgetCard>
  );
}

function Body({
  data,
  limit,
  sort,
}: {
  data: DockerTopData;
  limit: number;
  sort: SortBy;
}) {
  if (data.items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">no running containers</div>
    );
  }

  const sorted = sortByMetric(data.items, sort);
  const shown = sorted.slice(0, limit);
  const hidden = sorted.length - shown.length;

  return (
    <ul className="space-y-2.5">
      {shown.map((item) => (
        <Row key={item.id} item={item} sort={sort} />
      ))}
      {hidden > 0 && (
        <li className="text-xs text-muted-foreground">+{hidden} more</li>
      )}
    </ul>
  );
}

function Row({ item, sort }: { item: DockerTopItem; sort: SortBy }) {
  const pct = sort === "memory" ? item.memPct : item.cpu;
  const value =
    sort === "memory" ? formatBytes(item.memUsed) : `${item.cpu.toFixed(1)}%`;
  const secondary =
    sort === "memory"
      ? `${item.cpu.toFixed(1)}% cpu`
      : formatBytes(item.memUsed);

  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium">{item.name}</span>
        <span className="shrink-0 tabular-nums">
          {value}
          <span className="ml-1.5 text-xs text-muted-foreground">
            {secondary}
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </li>
  );
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 MB";
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })} GB`;
}
