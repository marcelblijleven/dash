"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import type { DnsStatsSnapshot } from "@/lib/dns/types";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";

function formatCount(n: number): string {
  return n.toLocaleString();
}

export function DnsStatsLive({
  widgetId,
  title,
  initial,
}: {
  widgetId: string;
  title: string;
  initial: DnsStatsSnapshot | null;
}) {
  const { data, status, updatedAt } = usePoll<DnsStatsSnapshot>(
    `/api/widgets/dns-stats/${encodeURIComponent(widgetId)}`,
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
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <Body data={data} />
      )}
    </WidgetCard>
  );
}

function Body({ data }: { data: DnsStatsSnapshot }) {
  const pct = data.blockedPercent;
  return (
    <div className="space-y-3">
      <div>
        <div className="text-3xl font-semibold tabular-nums">
          {pct.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground">blocked today</div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Queries</dt>
        <dd className="text-right tabular-nums">
          {formatCount(data.totalQueries)}
        </dd>
        <dt className="text-muted-foreground">Blocked</dt>
        <dd className="text-right tabular-nums">{formatCount(data.blocked)}</dd>
        {data.domainsBlocked !== null && (
          <>
            <dt className="text-muted-foreground">Blocklist</dt>
            <dd className="text-right tabular-nums">
              {formatCount(data.domainsBlocked)}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
