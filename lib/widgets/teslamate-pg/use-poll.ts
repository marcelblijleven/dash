"use client";

import { useEffect, useState } from "react";

type Status = "ok" | "stale" | "error";

const POLL_INTERVAL_MS = 60_000;

export function usePoll<T>(
  url: string,
  initial: T | null,
): { data: T | null; status: Status; updatedAt: number | null } {
  const [data, setData] = useState<T | null>(initial);
  const [status, setStatus] = useState<Status>(initial ? "ok" : "stale");
  const [updatedAt, setUpdatedAt] = useState<number | null>(() =>
    initial ? Date.now() : null,
  );

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as T;
        if (cancelled) return;
        setData(json);
        setStatus("ok");
        setUpdatedAt(Date.now());
      } catch {
        if (cancelled) return;
        setStatus((prev) => (prev === "ok" ? "stale" : "error"));
      }
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [url]);

  return { data, status, updatedAt };
}
