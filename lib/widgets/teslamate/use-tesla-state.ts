"use client";

import { useEffect, useState } from "react";
import type { TeslaState } from "@/lib/teslamate/mqtt";

type Status = "live" | "stale";
type Listener = (data: TeslaState, status: Status) => void;

type Channel = {
  source: EventSource | null;
  latest: TeslaState | null;
  status: Status;
  listeners: Set<Listener>;
};

const channels = new Map<string, Channel>();

function ensureSource(carId: string): Channel {
  let channel = channels.get(carId);
  if (!channel) {
    channel = {
      source: null,
      latest: null,
      status: "live",
      listeners: new Set(),
    };
    channels.set(carId, channel);
  }
  if (channel.source || typeof window === "undefined") return channel;

  const source = new EventSource(
    `/api/widgets/teslamate/${encodeURIComponent(carId)}/stream`,
  );
  channel.source = source;
  source.onmessage = (event) => {
    try {
      const next = JSON.parse(event.data) as TeslaState;
      channel.latest = next;
      channel.status = "live";
      for (const listener of channel.listeners) listener(next, "live");
    } catch {
      // ignore malformed payload
    }
  };
  source.onerror = () => {
    channel.status = "stale";
    if (channel.latest) {
      for (const listener of channel.listeners)
        listener(channel.latest, "stale");
    }
  };
  return channel;
}

function teardown(carId: string): void {
  const channel = channels.get(carId);
  if (!channel || channel.listeners.size > 0) return;
  channel.source?.close();
  channels.delete(carId);
}

export function useTeslaState(
  carId: string,
  initial: TeslaState | null,
): {
  data: TeslaState | null;
  stale: boolean;
  updatedAt: number | null;
} {
  const [data, setData] = useState<TeslaState | null>(initial);
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
    const channel = ensureSource(carId);
    channel.listeners.add(listener);

    if (channel.latest) listener(channel.latest, channel.status);

    return () => {
      channel.listeners.delete(listener);
      teardown(carId);
    };
  }, [carId]);

  return { data, stale, updatedAt };
}
