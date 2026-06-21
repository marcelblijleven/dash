"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";

export type DockerStatsData = {
  total: number;
  running: number;
  unhealthy: number;
};

export function DockerStatsLive({
  title,
  initial,
}: {
  title: string;
  initial: DockerStatsData | null;
}) {
  const { data, status, updatedAt } = usePoll<DockerStatsData>(
    "/api/widgets/docker-stats",
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
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <Body data={data} />
      )}
    </WidgetCard>
  );
}

function Body({ data }: { data: DockerStatsData }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
      <dt className="text-muted-foreground">Running</dt>
      <dd className="text-right tabular-nums">
        {data.running} / {data.total}
      </dd>
      {data.unhealthy > 0 && (
        <>
          <dt className="text-muted-foreground">Unhealthy</dt>
          <dd className="text-right tabular-nums text-red-500 dark:text-red-400">
            {data.unhealthy}
          </dd>
        </>
      )}
    </dl>
  );
}
