"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type { Odometer } from "./query";

export function TeslamateOdometerLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: Odometer | null;
}) {
  const { data, status, updatedAt } = usePoll<Odometer>(
    `/api/widgets/teslamate-pg/odometer/${carId}`,
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
        <Skeleton className="h-10 w-3/5" />
      ) : data.odometerKm === null ? (
        <div className="text-sm text-muted-foreground">no reading recorded</div>
      ) : (
        <div className="text-3xl font-semibold tabular-nums">
          {Math.round(data.odometerKm).toLocaleString("en-US")}
          <span className="ml-1 text-base font-normal text-muted-foreground">
            km
          </span>
        </div>
      )}
    </WidgetCard>
  );
}
