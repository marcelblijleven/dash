"use client";

import { useEffect, useState } from "react";
import { RelativeTime } from "@/components/relative-time";
import { formatBytes, formatUptime } from "@/lib/utils";

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

const POLL_MS = 5000;

export function HostStatsLive({ initial }: { initial: HostStatsData }) {
  const [stats, setStats] = useState(initial);
  const [stale, setStale] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(() => Date.now());

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
          setStats(await res.json());
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

  return (
    <div className="space-y-2">
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
      <div className="flex items-center justify-end text-xs text-muted-foreground">
        {stale ? (
          <span className="text-amber-600 dark:text-amber-400">
            stats temporarily unavailable
          </span>
        ) : (
          <RelativeTime since={updatedAt} />
        )}
      </div>
    </div>
  );
}
