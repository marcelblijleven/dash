"use client";

import { RelativeTime } from "@/components/relative-time";
import { WidgetCard } from "@/components/widget-card";
import { formatBytes, formatUptime } from "@/lib/utils";
import { useHostStats } from "./use-host-stats";

export type HostStatsData = {
  uptime: number | null;
  loadAvg: [number, number, number] | null;
  memTotal: number | null;
  memAvailable: number | null;
  ncpu: number | null;
  samples?: {
    t: number;
    loadAvg: [number, number, number] | null;
    memUsed: number | null;
    memTotal: number | null;
    ncpu: number | null;
  }[];
};

export function HostStatsLive({
  title,
  initial,
}: {
  title: string;
  initial: HostStatsData;
}) {
  const { data: stats, stale, updatedAt } = useHostStats(initial);

  const hint = (
    <span className="text-xs text-muted-foreground">
      {stale ? (
        <span className="text-amber-600 dark:text-amber-400">stale</span>
      ) : (
        <RelativeTime since={updatedAt} />
      )}
    </span>
  );

  return (
    <WidgetCard title={title} hint={hint}>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Uptime</dt>
        <dd className="text-right tabular-nums">
          {stats.uptime !== null ? formatUptime(stats.uptime) : "-"}
        </dd>
        <dt className="text-muted-foreground">Load</dt>
        <dd className="text-right tabular-nums">
          {stats.loadAvg?.map((n) => n.toFixed(2)).join(" / ") ?? "-"}
        </dd>
        <dt className="text-muted-foreground">Memory</dt>
        <dd className="text-right tabular-nums">
          {stats.memTotal !== null && stats.memAvailable !== null
            ? `${formatBytes(stats.memTotal - stats.memAvailable)} / ${formatBytes(stats.memTotal)}`
            : "-"}
        </dd>
        {stats.ncpu !== null && (
          <>
            <dt className="text-muted-foreground">CPUs</dt>
            <dd className="text-right tabular-nums">{stats.ncpu}</dd>
          </>
        )}
      </dl>
    </WidgetCard>
  );
}
