"use client";

import { useEffect, useState } from "react";
import { RelativeTime } from "@/components/relative-time";
import { Sparkline } from "@/components/sparkline";
import { StatCard } from "@/components/stat-card";
import { formatBytes, formatUptime } from "@/lib/utils";
import type { HostStatsData } from "../host-stats/host-stats-live";

const POLL_MS = 5000;

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
  const [data, setData] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState<number | null>(() => Date.now());
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function tick() {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetch("/api/widgets/host-stats", {
          cache: "no-store",
        });
        if (!cancelled && res.ok) {
          setData(await res.json());
          setUpdatedAt(Date.now());
          setStale(false);
        } else if (!cancelled) {
          setStale(true);
        }
      } catch {
        if (!cancelled) setStale(true);
      } finally {
        inFlight = false;
      }
    }

    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

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
