"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type { TeslaStats } from "./query";

export function TeslamateStatsLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: TeslaStats | null;
}) {
  const { data, status, updatedAt } = usePoll<TeslaStats>(
    `/api/widgets/teslamate-pg/stats/${carId}`,
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
      {data ? (
        <Body stats={data} />
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

function Body({ stats }: { stats: TeslaStats }) {
  const fmtKm = (v: number) => `${Math.round(v).toLocaleString("en-US")} km`;
  const fmtKwh = (v: number) =>
    `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })} kWh`;
  const fmtCost = (v: number) =>
    `${stats.costCurrency ? `${stats.costCurrency} ` : ""}${v.toLocaleString(
      "en-US",
      { maximumFractionDigits: 2 },
    )}`;

  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <Cell
        label="Driven"
        lifetime={fmtKm(stats.lifetime.km)}
        recent={fmtKm(stats.last30d.km)}
      />
      <Cell
        label="Charged"
        lifetime={fmtKwh(stats.lifetime.kwh)}
        recent={fmtKwh(stats.last30d.kwh)}
      />
      <Cell
        label="Cost"
        lifetime={fmtCost(stats.lifetime.cost)}
        recent={fmtCost(stats.last30d.cost)}
      />
    </div>
  );
}

function Cell({
  label,
  lifetime,
  recent,
}: {
  label: string;
  lifetime: string;
  recent: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{lifetime}</div>
      <div className="text-xs text-muted-foreground tabular-nums">
        30d {recent}
      </div>
    </div>
  );
}
