"use client";

import { useEffect, useState } from "react";
import type { LiveStatsData } from "./types";

type Status = "live" | "stale";
type Listener = (data: LiveStatsData, status: Status) => void;

let source: EventSource | null = null;
let latest: LiveStatsData | null = null;
let status: Status = "live";
const listeners = new Set<Listener>();

function broadcast() {
  if (!latest) return;
  for (const listener of listeners) listener(latest, status);
}

function teardown() {
  if (listeners.size > 0) return;
  source?.close();
  source = null;
}

function ensureSource(id: string) {
  if (source || typeof window === "undefined") return;

  source = new EventSource(`/api/containers/${id}/stats/stream`);
  source.onmessage = (event) => {
    try {
      latest = JSON.parse(event.data) as LiveStatsData;
      status = "live";
      broadcast();
    } catch {
      // ignore
    }
  };
  source.onerror = () => {
    status = "stale";
    if (latest) broadcast();
  };
}

export function useContainerLiveStats(
  initial: LiveStatsData | null,
  id: string,
): {
  data: LiveStatsData | null;
  stale: boolean;
  updatedAt: number | null;
} {
  const [data, setData] = useState<LiveStatsData | null>(initial);
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
    ensureSource(id);

    if (latest) listener(latest, status);

    return () => {
      listeners.delete(listener);
      teardown();
    };
  }, [id]);

  return { data, stale, updatedAt };
}
