"use client";

import { useEffect, useState } from "react";
import { RelativeTime } from "@/components/relative-time";
import { StatCard } from "@/components/stat-card";
import { formatBytes } from "@/lib/utils";

const POLL_MS = 5000;

export function LiveStats({
  id,
  initial,
  restartCount,
  restartPolicy,
}: {
  id: string;
  initial: LiveStatsData | null;
  restartCount: number;
  restartPolicy: string;
}) {
  const [stats, setStats] = useState<LiveStatsData | null>(initial);
  const [stale, setStale] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(() =>
    initial ? Date.now() : null,
  );

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function tick() {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetch(`/api/containers/${id}/stats`, {
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

    const interval = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  const memPercent = stats?.memLimit
    ? (stats.memUsed / stats.memLimit) * 100
    : 0;

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="CPU"
          value={stats ? `${stats.cpu.toFixed(1)}%` : "-"}
          hint={stats ? `${stats.cores} cores` : undefined}
        />
        <StatCard
          title="Memory"
          value={stats ? formatBytes(stats.memUsed) : "-"}
          hint={
            stats?.memLimit
              ? `${memPercent.toFixed(0)}% of ${formatBytes(stats.memLimit)}`
              : undefined
          }
        />
        <StatCard
          title="Network rx / tx"
          value={
            stats
              ? `${formatBytes(stats.netRx)} / ${formatBytes(stats.netTx)}`
              : "-"
          }
        />
        <StatCard
          title="Restarts"
          value={String(restartCount)}
          hint={restartPolicy || "no policy"}
        />
      </div>
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
