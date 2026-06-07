"use client";

import { useEffect, useState } from "react";

export function RelativeTime({ since }: { since: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (since === null) return null;

  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return <>updated {format(seconds)} ago</>;
}

function format(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
