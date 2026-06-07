"use client";

import { RelativeTime } from "@/components/relative-time";
import { Sparkline } from "@/components/sparkline";
import { StatCard } from "@/components/stat-card";
import { formatBytes, formatUptime } from "@/lib/utils";
import type { HostStatsData } from "../host-stats/host-stats-live";
import { useHostStats } from "../host-stats/use-host-stats";

export type HostField = "uptime" | "memory" | "load" | "cpus";

export function HostStatCard({
  field,
  title,
  initial,
}: {
  field: HostField;
  title: string;
  initial: HostStatsData;
}) {
  const { data, stale, updatedAt } = useHostStats(initial);

  const view = render(field, data);
  const hint = stale ? (
    <span className="text-amber-600 dark:text-amber-400">stale</span>
  ) : (
    (view.hint ?? <RelativeTime since={updatedAt} />)
  );

  const spark =
    view.series && view.series.length >= 2 ? (
      <Sparkline data={view.series} />
    ) : undefined;

  return (
    <StatCard title={title} value={view.value} hint={hint} spark={spark} />
  );
}

function render(
  field: HostField,
  d: HostStatsData,
): { value: string; hint?: string; series?: number[] } {
  switch (field) {
    case "uptime":
      return {
        value: d.uptime !== null ? formatUptime(d.uptime) : "-",
      };
    case "memory": {
      const series =
        d.samples
          ?.map((s) => s.memUsed)
          .filter((v): v is number => v !== null) ?? [];
      return {
        value:
          d.memTotal !== null && d.memAvailable !== null
            ? formatBytes(d.memTotal - d.memAvailable)
            : "-",
        hint: d.memTotal !== null ? `of ${formatBytes(d.memTotal)}` : undefined,
        series,
      };
    }
    case "load": {
      const rest = d.loadAvg
        ? `${d.loadAvg[1].toFixed(2)} / ${d.loadAvg[2].toFixed(2)}`
        : null;
      const cpus = d.ncpu !== null ? `${d.ncpu} CPUs` : null;
      const series =
        d.samples
          ?.map((s) => s.loadAvg?.[0])
          .filter((v): v is number => v !== undefined && v !== null) ?? [];
      return {
        value: d.loadAvg ? d.loadAvg[0].toFixed(2) : "-",
        hint: rest && cpus ? `${rest} · ${cpus}` : (rest ?? cpus ?? undefined),
        series,
      };
    }
    case "cpus":
      return {
        value: d.ncpu !== null ? String(d.ncpu) : "-",
      };
  }
}
