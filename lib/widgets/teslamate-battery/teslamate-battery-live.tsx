"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/sparkline";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type { BatteryHealth } from "./query";

export function TeslamateBatteryLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: BatteryHealth | null;
}) {
  const { data, status, updatedAt } = usePoll<BatteryHealth>(
    `/api/widgets/teslamate-pg/battery/${carId}`,
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
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/5" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : data.points.length === 0 ? (
        <div className="text-sm text-muted-foreground">no charges recorded</div>
      ) : (
        <Body data={data} />
      )}
    </WidgetCard>
  );
}

function Body({ data }: { data: BatteryHealth }) {
  const series = data.points.map((p) => p.rangeKm);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums">
          {data.currentRangeKm !== null ? Math.round(data.currentRangeKm) : "-"}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            km at 100%
          </span>
        </div>
        {data.degradationPct !== null && (
          <div className="text-xs text-muted-foreground tabular-nums">
            -{data.degradationPct.toFixed(1)}% degraded
          </div>
        )}
      </div>
      <Sparkline data={series} />
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>best {Math.round(data.maxRangeKm ?? 0)} km</span>
        <span>now {Math.round(data.currentRangeKm ?? 0)} km</span>
      </div>
    </div>
  );
}
