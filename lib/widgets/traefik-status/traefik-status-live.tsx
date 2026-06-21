"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";

export type TraefikStatusData = {
  routerCount: number;
  enabledCount: number;
  servicesDown: number;
};

export function TraefikStatusLive({
  title,
  initial,
}: {
  title: string;
  initial: TraefikStatusData | null;
}) {
  const { data, status, updatedAt } = usePoll<TraefikStatusData>(
    "/api/widgets/traefik-status",
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

function Body({ data }: { data: TraefikStatusData }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
      <dt className="text-muted-foreground">Routers</dt>
      <dd className="text-right tabular-nums">
        {data.enabledCount} / {data.routerCount} enabled
      </dd>
      {data.servicesDown > 0 && (
        <>
          <dt className="text-muted-foreground">Services</dt>
          <dd className="text-right tabular-nums text-red-500 dark:text-red-400">
            {data.servicesDown} down
          </dd>
        </>
      )}
    </dl>
  );
}
