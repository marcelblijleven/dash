"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type { DrivePerformance } from "./query";

export function TeslamatePerformanceLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: DrivePerformance | null;
}) {
  const { data, status, updatedAt } = usePoll<DrivePerformance>(
    `/api/widgets/teslamate-pg/performance/${carId}`,
    initial,
  );

  const hint = (
    <span className="text-xs text-muted-foreground">
      last 30d ·{" "}
      {status === "ok" ? (
        <RelativeTime since={updatedAt} />
      ) : (
        <span className="text-amber-600 dark:text-amber-400">stale</span>
      )}
    </span>
  );

  return (
    <WidgetCard title={title} hint={hint}>
      {data ? (
        <Body data={data} />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      )}
    </WidgetCard>
  );
}

function Body({ data }: { data: DrivePerformance }) {
  const fmt = (v: number | null, unit: string) =>
    v === null ? "-" : `${Math.round(v).toLocaleString("en-US")} ${unit}`;

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-3 gap-3">
        <Cell label="Top speed" value={fmt(data.maxSpeedKmh, "km/h")} />
        <Cell label="Peak power" value={fmt(data.maxPowerKw, "kW")} />
        <Cell label="Longest" value={fmt(data.longestKm, "km")} />
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">
        {data.driveCount.toLocaleString("en-US")} drives ·{" "}
        {Math.round(data.totalKm).toLocaleString("en-US")} km total
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
