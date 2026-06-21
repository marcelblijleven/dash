"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import { formatMonth } from "./format";
import type { CostData, CostMonth } from "./query";

export function TeslamateCostLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: CostData | null;
}) {
  const { data, status, updatedAt } = usePoll<CostData>(
    `/api/widgets/teslamate-pg/cost/${carId}`,
    initial,
  );

  const hint = (
    <span className="text-xs text-muted-foreground">
      last 6mo ·{" "}
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
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      ) : data.months.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          no charging sessions recorded
        </div>
      ) : (
        <Body data={data} />
      )}
    </WidgetCard>
  );
}

function Body({ data }: { data: CostData }) {
  const fmtCost = (v: number) =>
    `${data.currency ? `${data.currency} ` : ""}${v.toFixed(2)}`;
  const maxTotal = Math.max(
    ...data.months.map((m) => m.homeCost + m.publicCost),
    1,
  );

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {data.months.map((m) => (
          <MonthRow
            key={m.month}
            month={m}
            maxTotal={maxTotal}
            fmtCost={fmtCost}
          />
        ))}
      </div>
      <Legend />
    </div>
  );
}

function MonthRow({
  month,
  maxTotal,
  fmtCost,
}: {
  month: CostMonth;
  maxTotal: number;
  fmtCost: (n: number) => string;
}) {
  const total = month.homeCost + month.publicCost;
  const totalKwh = month.homeKwh + month.publicKwh;
  const homePct = total > 0 ? (month.homeCost / total) * 100 : 0;
  const widthPct = (total / maxTotal) * 100;

  return (
    <div className="grid grid-cols-[3.5rem_1fr_max-content] items-center gap-2 text-sm">
      <div className="text-xs text-muted-foreground tabular-nums">
        {formatMonth(month.month)}
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded bg-muted">
        <div
          className="flex h-full"
          style={{ width: `${widthPct}%` }}
          title={`${totalKwh.toFixed(0)} kWh, ${month.sessions} sessions`}
        >
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${homePct}%` }}
          />
          <div
            className="h-full bg-blue-500"
            style={{ width: `${100 - homePct}%` }}
          />
        </div>
      </div>
      <div className="text-right tabular-nums">{fmtCost(total)}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex justify-end gap-3 pt-1 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="inline-block h-2 w-2 rounded bg-emerald-500" />
        home
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-2 w-2 rounded bg-blue-500" />
        public
      </span>
    </div>
  );
}
