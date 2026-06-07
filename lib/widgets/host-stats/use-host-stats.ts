"use client";

import { useEffect, useState } from "react";
import type { HostStatsData } from "./host-stats-live";

type Status = "live" | "stale";
type Listener = (data: HostStatsData, status: Status) => void;

let source: EventSource | null = null;
let latest: HostStatsData | null = null;
let status: Status = "live";
const listeners = new Set<Listener>();

function broadcast() {
  if (!latest) return;
  for (const listener of listeners) listener(latest, status);
}

function ensureSource() {
  if (source || typeof window === "undefined") return;
  source = new EventSource("/api/widgets/host-stats/stream");
  source.onmessage = (event) => {
    try {
      latest = JSON.parse(event.data) as HostStatsData;
      status = "live";
      broadcast();
    } catch {
      // ignore malformed payload
    }
  };
  source.onerror = () => {
    // EventSource auto-reconnects; mark stale until next message
    status = "stale";
    if (latest) broadcast();
  };
}

function teardown() {
  if (listeners.size > 0) return;
  source?.close();
  source = null;
}

export function useHostStats(initial: HostStatsData): {
  data: HostStatsData;
  stale: boolean;
  updatedAt: number | null;
} {
  const [data, setData] = useState<HostStatsData>(initial);
  const [stale, setStale] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(() => Date.now());

  useEffect(() => {
    const listener: Listener = (next, nextStatus) => {
      setData(next);
      if (nextStatus === "live") {
        setStale(false);
        setUpdatedAt(Date.now());
      } else {
        setStale(true);
      }
    };
    listeners.add(listener);
    ensureSource();

    if (latest) listener(latest, status);

    return () => {
      listeners.delete(listener);
      teardown();
    };
  }, []);

  return { data, stale, updatedAt };
}
