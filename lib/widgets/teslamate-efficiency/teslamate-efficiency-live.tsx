"use client";

import { RelativeTime } from "@/components/relative-time";
import { Sparkline } from "@/components/sparkline";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type { EfficiencyData } from "./query";

export function TeslamateEfficiencyLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: EfficiencyData | null;
}) {
  const { data, status, updatedAt } = usePoll<EfficiencyData>(
    `/api/widgets/teslamate-pg/efficiency/${carId}`,
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
      {!data ? (
        <div className="text-sm text-muted-foreground">loading…</div>
      ) : data.points.length === 0 ? (
        <div className="text-sm text-muted-foreground">no drives recorded</div>
      ) : (
        <Body data={data} />
      )}
    </WidgetCard>
  );
}

function Body({ data }: { data: EfficiencyData }) {
  const series = data.points.map((p) => p.whPerKm);
  const min = Math.min(...series);
  const max = Math.max(...series);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums">
          {data.avgWhPerKm !== null ? Math.round(data.avgWhPerKm) : "-"}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            Wh/km avg
          </span>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {Math.round(data.totalKm).toLocaleString("en-US")} km
        </div>
      </div>
      <Sparkline data={series} />
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>min {Math.round(min)}</span>
        <span>max {Math.round(max)}</span>
      </div>
    </div>
  );
}
