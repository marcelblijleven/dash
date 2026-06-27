"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type { Tpms } from "./query";

export function TeslamateTpmsLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: Tpms | null;
}) {
  const { data, status, updatedAt } = usePoll<Tpms>(
    `/api/widgets/teslamate-pg/tpms/${carId}`,
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

  const hasReading =
    data &&
    (data.fl !== null ||
      data.fr !== null ||
      data.rl !== null ||
      data.rr !== null);

  return (
    <WidgetCard title={title} hint={hint}>
      {!data ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : !hasReading ? (
        <div className="text-sm text-muted-foreground">
          no tyre pressure recorded
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Tyre label="Front left" bar={data.fl} />
          <Tyre label="Front right" bar={data.fr} />
          <Tyre label="Rear left" bar={data.rl} />
          <Tyre label="Rear right" bar={data.rr} />
        </div>
      )}
    </WidgetCard>
  );
}

function Tyre({ label, bar }: { label: string; bar: number | null }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">
        {bar !== null ? bar.toFixed(1) : "-"}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          bar
        </span>
      </div>
    </div>
  );
}
