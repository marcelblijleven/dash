"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import type { StatusEntry, StatusSnapshot } from "@/lib/status";
import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger";

function variantFor(entry: StatusEntry): Variant {
  if (!entry.running) return "danger";
  if (!entry.healthy) return "warning";
  return "success";
}

function statusLabel(entry: StatusEntry): string {
  if (!entry.running) return "down";
  if (!entry.healthy) return "unhealthy";
  return "up";
}

function groupByCategory(
  entries: StatusEntry[],
): Array<[string, StatusEntry[]]> {
  const map = new Map<string, StatusEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.category) ?? [];
    list.push(entry);
    map.set(entry.category, list);
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (a === "uncategorized") return 1;
    if (b === "uncategorized") return -1;
    return a.localeCompare(b);
  });
}

export function StatusGrid({ initial }: { initial: StatusSnapshot }) {
  const [snapshot, setSnapshot] = useState<StatusSnapshot>(initial);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/status/stream");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      try {
        const next = JSON.parse(event.data) as StatusSnapshot;
        setSnapshot(next);
      } catch {
        // ignore malformed frames
      }
    };
    return () => {
      source.close();
    };
  }, []);

  const groups = groupByCategory(snapshot.entries);
  const total = snapshot.entries.length;
  const up = snapshot.entries.filter((e) => e.running && e.healthy).length;
  const warning = snapshot.entries.filter(
    (e) => e.running && !e.healthy,
  ).length;
  const down = snapshot.entries.filter((e) => !e.running).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground tabular-nums">
        <span>
          <span className="font-medium text-foreground">{up}</span> up
        </span>
        <span>
          <span className="font-medium text-foreground">{warning}</span>{" "}
          unhealthy
        </span>
        <span>
          <span className="font-medium text-foreground">{down}</span> down
        </span>
        <span aria-hidden>·</span>
        <span>{total} total</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5",
            connected ? "text-emerald-600" : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          <span
            className={cn(
              "inline-block size-1.5 rounded-full",
              connected ? "bg-emerald-500" : "bg-muted-foreground",
            )}
            aria-hidden
          />
          {connected ? "live" : "reconnecting"}
        </span>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No containers or apps found.
          </CardContent>
        </Card>
      ) : (
        groups.map(([category, items]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((entry) => (
                <StatusCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function StatusCard({ entry }: { entry: StatusEntry }) {
  const variant = variantFor(entry);
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <StatusIcon icon={entry.icon} name={entry.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium tracking-tight">
            {entry.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {statusLabel(entry)}
          </div>
        </div>
        <StatusDot variant={variant} />
      </CardContent>
    </Card>
  );
}

function StatusIcon({ icon, name }: { icon?: string; name: string }) {
  if (icon?.startsWith("http")) {
    return (
      <Image
        src={icon}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-md"
        unoptimized
      />
    );
  }
  if (icon) {
    return (
      <Image
        src={`https://cdn.jsdelivr.net/gh/selfhst/icons/png/${icon}.png`}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-md"
        unoptimized
      />
    );
  }
  return (
    <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
      {name[0]?.toUpperCase()}
    </div>
  );
}
