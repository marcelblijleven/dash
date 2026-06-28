"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import type { DownloadItem, DownloadSnapshot } from "@/lib/download/types";
import { formatBytes } from "@/lib/utils";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import { formatEta, formatSpeed } from "./format";

export function DownloadClientLive({
  widgetId,
  title,
  initial,
  limit,
}: {
  widgetId: string;
  title: string;
  initial: DownloadSnapshot | null;
  limit: number;
}) {
  const { data, status, updatedAt } = usePoll<DownloadSnapshot>(
    `/api/widgets/download-client/${encodeURIComponent(widgetId)}`,
    initial,
  );

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
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <Body data={data} limit={limit} />
      )}
    </WidgetCard>
  );
}

function Body({ data, limit }: { data: DownloadSnapshot; limit: number }) {
  const shown = data.items.slice(0, limit);
  const hidden = data.items.length - shown.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm tabular-nums">
        <span className="flex items-center gap-1">
          <ArrowDown className="size-3.5 text-emerald-500" aria-hidden />
          {formatSpeed(data.downloadSpeed)}
        </span>
        {data.uploadSpeed !== null && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <ArrowUp className="size-3.5" aria-hidden />
            {formatSpeed(data.uploadSpeed)}
          </span>
        )}
      </div>
      {data.items.length === 0 ? (
        <div className="text-sm text-muted-foreground">nothing downloading</div>
      ) : (
        <>
          <ul className="space-y-2 text-sm">
            {shown.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ul>
          {hidden > 0 && (
            <div className="text-xs text-muted-foreground">+{hidden} more</div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ item }: { item: DownloadItem }) {
  const pct = Math.round(item.progress * 100);
  const eta =
    item.etaSeconds !== null && item.etaSeconds > 0
      ? formatEta(item.etaSeconds)
      : null;
  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate font-medium">{item.name}</span>
        <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {pct}%{eta && <span className="ml-1">· {eta}</span>}
          <span className="ml-1">· {formatBytes(item.sizeBytes)}</span>
        </span>
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
