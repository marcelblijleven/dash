"use client";

import { useEffect, useState } from "react";
import type { ArrSnapshot } from "@/lib/arr/types";

type Status = "ok" | "stale" | "error";

const POLL_INTERVAL_MS = 30_000;

export function useArr(
  widgetId: string,
  initial: ArrSnapshot | null,
): { data: ArrSnapshot | null; status: Status; updatedAt: number | null } {
  const [data, setData] = useState<ArrSnapshot | null>(initial);
  const [status, setStatus] = useState<Status>(initial ? "ok" : "stale");
  const [updatedAt, setUpdatedAt] = useState<number | null>(() =>
    initial ? Date.now() : null,
  );

  useEffect(() => {
    let cancelled = false;
    const url = `/api/widgets/arr/${encodeURIComponent(widgetId)}`;

    const tick = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as ArrSnapshot;
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
  }, [widgetId]);

  return { data, status, updatedAt };
}
