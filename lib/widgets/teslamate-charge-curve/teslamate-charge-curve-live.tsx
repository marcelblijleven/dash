"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/sparkline";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type { ChargeCurve } from "./query";

export function TeslamateChargeCurveLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: ChargeCurve | null;
}) {
  const { data, status, updatedAt } = usePoll<ChargeCurve>(
    `/api/widgets/teslamate-pg/charge-curve/${carId}`,
    initial,
  );

  const hint = (
    <span className="text-xs text-muted-foreground">
      last charge ·{" "}
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
      ) : data.points.length < 2 ? (
        <div className="text-sm text-muted-foreground">
          no charging curve recorded
        </div>
      ) : (
        <Body data={data} />
      )}
    </WidgetCard>
  );
}

function Body({ data }: { data: ChargeCurve }) {
  const series = data.points.map((p) => p.kw);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums">
          {data.peakKw !== null ? Math.round(data.peakKw) : "-"}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            kW peak
          </span>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {data.socStart ?? "?"}% &rarr; {data.socEnd ?? "?"}%
          {data.energyKwh !== null
            ? ` · ${data.energyKwh.toLocaleString("en-US", {
                maximumFractionDigits: 1,
              })} kWh`
            : ""}
        </div>
      </div>
      <Sparkline data={series} />
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{data.points[0].soc}%</span>
        <span>{data.points[data.points.length - 1].soc}%</span>
      </div>
    </div>
  );
}
