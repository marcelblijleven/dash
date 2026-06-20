"use client";

import { RelativeTime } from "@/components/relative-time";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type {
  RecentCharge,
  RecentDrive,
  RecentItem,
  RecentMode,
} from "./query";

export function TeslamateRecentLive({
  carId,
  mode,
  title,
  initial,
}: {
  carId: number;
  mode: RecentMode;
  title: string;
  initial: RecentItem[] | null;
}) {
  const { data, status, updatedAt } = usePoll<RecentItem[]>(
    `/api/widgets/teslamate-pg/recent/${carId}?mode=${mode}`,
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
        <div className="text-sm text-muted-foreground">loading…</div>
      ) : data.length === 0 ? (
        <div className="text-sm text-muted-foreground">no recent {mode}</div>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {data.map((item) =>
            item.kind === "drive" ? (
              <DriveRow key={item.id} drive={item} />
            ) : (
              <ChargeRow key={item.id} charge={item} />
            ),
          )}
        </ul>
      )}
    </WidgetCard>
  );
}

function DriveRow({ drive }: { drive: RecentDrive }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="truncate" data-sensitive="">
          {drive.endLabel ?? "Drive"}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDateTime(drive.startedAt)}
          {drive.durationMin !== null &&
            ` · ${formatDuration(drive.durationMin)}`}
        </div>
      </div>
      <div className="text-right tabular-nums">
        {Math.round(drive.distanceKm)} km
      </div>
    </li>
  );
}

function ChargeRow({ charge }: { charge: RecentCharge }) {
  const socDelta =
    charge.startSoc !== null && charge.endSoc !== null
      ? `${charge.startSoc}→${charge.endSoc}%`
      : null;
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="truncate" data-sensitive="">
          {charge.label ?? "Charging"}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDateTime(charge.startedAt)}
          {socDelta && ` · ${socDelta}`}
        </div>
      </div>
      <div className="text-right tabular-nums">
        <div>{charge.energyKwh.toFixed(1)} kWh</div>
        {charge.cost !== null && (
          <div className="text-xs text-muted-foreground">
            {charge.cost.toFixed(2)}
          </div>
        )}
      </div>
    </li>
  );
}

function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
