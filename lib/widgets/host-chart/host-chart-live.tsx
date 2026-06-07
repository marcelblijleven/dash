"use client";

import { RelativeTime } from "@/components/relative-time";
import { WidgetCard } from "@/components/widget-card";
import { formatBytes } from "@/lib/utils";
import type { HostStatsData } from "../host-stats/host-stats-live";
import { useHostStats } from "../host-stats/use-host-stats";

export type HostChartMetric = "load" | "memory";

type Sample = NonNullable<HostStatsData["samples"]>[number];

export function HostChartLive({
  metric,
  title,
  initial,
}: {
  metric: HostChartMetric;
  title: string;
  initial: HostStatsData;
}) {
  const { data, stale, updatedAt } = useHostStats(initial);

  const series = extractSeries(metric, data.samples ?? []);
  const current = currentValue(metric, data);
  const formatY =
    metric === "memory" ? formatBytes : (v: number) => v.toFixed(2);

  const hint = (
    <span className="text-xs text-muted-foreground">
      last 5 min ·{" "}
      {stale ? (
        <span className="text-amber-600 dark:text-amber-400">stale</span>
      ) : (
        <RelativeTime since={updatedAt} />
      )}
    </span>
  );

  return (
    <WidgetCard title={title} hint={hint}>
      <div className="space-y-3">
        <div className="text-2xl font-semibold tabular-nums">{current}</div>
        <Chart data={series} formatY={formatY} />
      </div>
    </WidgetCard>
  );
}

function extractSeries(metric: HostChartMetric, samples: Sample[]): number[] {
  if (metric === "memory") {
    return samples.map((s) => s.memUsed).filter((v): v is number => v !== null);
  }
  return samples
    .map((s) => s.loadAvg?.[0])
    .filter((v): v is number => v !== undefined && v !== null);
}

function currentValue(metric: HostChartMetric, d: HostStatsData): string {
  if (metric === "memory") {
    return d.memTotal !== null && d.memAvailable !== null
      ? formatBytes(d.memTotal - d.memAvailable)
      : "-";
  }
  return d.loadAvg ? d.loadAvg[0].toFixed(2) : "-";
}

function Chart({
  data,
  formatY,
}: {
  data: number[];
  formatY: (n: number) => string;
}) {
  if (data.length < 2) {
    return (
      <div className="h-32 rounded-md border border-dashed border-border bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
        collecting samples…
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 100;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const fillPath = `${linePath} L${w} ${h} L0 ${h} Z`;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>min {formatY(min)}</span>
        <span>max {formatY(max)}</span>
      </div>
      <svg
        className="block h-32 w-full"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <title>Host stats chart</title>
        <path d={fillPath} className="fill-primary/15" />
        <path
          d={linePath}
          className="stroke-primary fill-none"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
