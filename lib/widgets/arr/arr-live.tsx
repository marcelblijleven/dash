"use client";

import { RelativeTime } from "@/components/relative-time";
import { WidgetCard } from "@/components/widget-card";
import type {
  ArrCalendarItem,
  ArrQueueItem,
  ArrSnapshot,
} from "@/lib/arr/types";
import { formatBytes } from "@/lib/utils";
import { useArr } from "./use-arr";

export function ArrLive({
  widgetId,
  title,
  initial,
  limit,
}: {
  widgetId: string;
  title: string;
  initial: ArrSnapshot | null;
  limit: number;
}) {
  const { data, status, updatedAt } = useArr(widgetId, initial);

  const hint = (
    <span className="text-xs text-muted-foreground">
      {status === "ok" ? (
        <RelativeTime since={updatedAt} />
      ) : (
        <span className="text-amber-600 dark:text-amber-400">stale</span>
      )}
    </span>
  );

  return (
    <WidgetCard title={title} hint={hint}>
      {!data ? (
        <div className="text-sm text-muted-foreground">loading…</div>
      ) : (
        <Body snapshot={data} limit={limit} />
      )}
    </WidgetCard>
  );
}

function Body({ snapshot, limit }: { snapshot: ArrSnapshot; limit: number }) {
  const queue = snapshot.queue.slice(0, limit);
  const calendar = snapshot.calendar.slice(0, limit);

  if (queue.length === 0 && calendar.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        no activity or upcoming releases
      </div>
    );
  }

  return (
    <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
      <Section
        label={`Downloading${snapshot.queue.length > queue.length ? ` · ${snapshot.queue.length} total` : ""}`}
        empty="queue empty"
      >
        {queue.map((item) => (
          <QueueRow key={item.id} item={item} />
        ))}
      </Section>
      <Section
        label={`Upcoming${snapshot.calendar.length > calendar.length ? ` · ${snapshot.calendar.length} total` : ""}`}
        empty="nothing scheduled"
      >
        {calendar.map((item) => (
          <CalendarRow key={item.id} item={item} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  label,
  empty,
  children,
}: {
  label: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children.length === 0 ? (
        <div className="text-sm text-muted-foreground">{empty}</div>
      ) : (
        <ul className="divide-y divide-border text-sm">{children}</ul>
      )}
    </div>
  );
}

function QueueRow({ item }: { item: ArrQueueItem }) {
  const pct = Math.round(item.progress * 100);
  const eta =
    item.etaSeconds !== null && item.etaSeconds > 0
      ? formatEta(item.etaSeconds)
      : null;
  return (
    <li className="space-y-1 py-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{item.title}</div>
          {item.subtitle && (
            <div className="truncate text-xs text-muted-foreground">
              {item.subtitle}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          <div>
            {pct}%{eta && <span className="ml-1">· {eta}</span>}
          </div>
          <div>{formatBytes(item.sizeBytes)}</div>
        </div>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function CalendarRow({ item }: { item: ArrCalendarItem }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="truncate font-medium">{item.title}</div>
        {item.subtitle && (
          <div className="truncate text-xs text-muted-foreground">
            {item.subtitle}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {formatAirDate(item.airDate)}
      </div>
    </li>
  );
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

function formatAirDate(iso: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round(
    (startOfDate.getTime() - startOfToday.getTime()) / 86400000,
  );

  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (dayDiff === 0) return `today · ${time}`;
  if (dayDiff === 1) return `tomorrow · ${time}`;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
