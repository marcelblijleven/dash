"use client";

import { RelativeTime } from "@/components/relative-time";
import { Badge } from "@/components/ui/badge";
import { WidgetCard } from "@/components/widget-card";
import type { TeslaState } from "@/lib/teslamate/mqtt";
import {
  formatCharging,
  formatClimate,
  formatOdometer,
  isActivelyReporting,
} from "./format";
import { useTeslaState } from "./use-tesla-state";

export function TeslamateLive({
  carId,
  title,
  initial,
}: {
  carId: string;
  title: string;
  initial: TeslaState | null;
}) {
  const { data, stale, updatedAt } = useTeslaState(carId, initial);

  // When the car is asleep/offline the displayed values are frozen from the
  // last online moment, so "updated Xs ago" misrepresents the data freshness.
  // The state row already shows how long the car has been in that state.
  const isReporting = data ? isActivelyReporting(data.state) : true;
  const hint = stale ? (
    <span className="text-xs text-amber-600 dark:text-amber-400">stale</span>
  ) : isReporting ? (
    <span className="text-xs text-muted-foreground">
      <RelativeTime since={updatedAt} />
    </span>
  ) : null;

  const displayTitle =
    title || data?.displayName || `Tesla ${data?.carId ?? carId}`;

  return (
    <WidgetCard title={displayTitle} hint={hint}>
      {data ? <Body data={data} /> : <Empty />}
    </WidgetCard>
  );
}

function Empty() {
  return (
    <div className="text-sm text-muted-foreground">
      waiting for first MQTT message…
    </div>
  );
}

function Body({ data }: { data: TeslaState }) {
  const battery = data.usableBatteryLevel ?? data.batteryLevel;
  const range = data.estBatteryRangeKm;
  const isCharging = data.chargingState === "Charging";
  const isPlugged = isCharging || data.pluggedIn === true;
  const climate = formatClimate(data);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          {battery !== null ? `${Math.round(battery)}%` : "-"}
        </span>
        {range !== null && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {Math.round(range)} km
          </span>
        )}
        {data.updateAvailable === true && (
          <Badge variant="warning" className="ml-auto">
            update
          </Badge>
        )}
      </div>
      <BatteryBar
        percent={battery}
        limit={data.chargeLimitSoc}
        charging={isCharging}
      />
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">State</dt>
        <dd className="text-right">
          <StateLabel state={data.state} />
        </dd>
        {isPlugged && (
          <>
            <dt className="text-muted-foreground">Charging</dt>
            <dd className="text-right tabular-nums">{formatCharging(data)}</dd>
          </>
        )}
        {data.geofence && (
          <>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="text-right" data-sensitive="">
              {data.geofence}
            </dd>
          </>
        )}
        {data.state === "driving" && data.speed !== null && (
          <>
            <dt className="text-muted-foreground">Speed</dt>
            <dd className="text-right tabular-nums">{data.speed} km/h</dd>
          </>
        )}
        {climate && (
          <>
            <dt className="text-muted-foreground">Climate</dt>
            <dd className="text-right tabular-nums">{climate}</dd>
          </>
        )}
        {data.odometer !== null && (
          <>
            <dt className="text-muted-foreground">Odometer</dt>
            <dd className="text-right tabular-nums">
              {formatOdometer(data.odometer)}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}

function StateLabel({ state }: { state: string | null }) {
  if (!state) return <span className="text-muted-foreground">-</span>;
  const color =
    state === "driving"
      ? "text-blue-600 dark:text-blue-400"
      : state === "charging"
        ? "text-green-600 dark:text-green-400"
        : state === "asleep" || state === "offline"
          ? "text-muted-foreground"
          : "";
  return <span className={color}>{state}</span>;
}

const CELL_COUNT = 10;
const LOW_ZONE_CELLS = 2;
const BATTERY_CELL_KEYS = Array.from(
  { length: CELL_COUNT },
  (_, i) => `cell-${i}`,
);

function BatteryBar({
  percent,
  limit,
  charging,
}: {
  percent: number | null;
  limit: number | null;
  charging: boolean;
}) {
  const pct = Math.max(0, Math.min(100, percent ?? 0));
  const limitPct = limit !== null ? Math.max(0, Math.min(100, limit)) : null;
  // Floor so a cell isn't shown as full until pct has actually crossed
  // its boundary (e.g. 79% reads as 7 filled, not 8). The pinging next
  // cell then represents the one currently filling up.
  const filledCells = Math.floor(pct / (100 / CELL_COUNT));
  const limitCell =
    limitPct !== null ? Math.round(limitPct / (100 / CELL_COUNT)) : null;
  // Charging never crosses the configured limit, so neither should the
  // pulsing "next" indicator.
  const maxCell = limitCell ?? CELL_COUNT;
  const nextFillCell =
    charging && filledCells < maxCell
      ? Math.min(filledCells + 1, maxCell)
      : null;

  return (
    <div
      role="img"
      className="flex gap-1"
      aria-label={`battery ${Math.round(pct)}%${
        limitPct !== null ? `, limit ${limitPct}%` : ""
      }`}
    >
      {BATTERY_CELL_KEYS.map((key, i) => {
        const idx = i + 1;
        const filled = idx <= filledCells;
        const inLowZone = idx <= LOW_ZONE_CELLS;
        const isLimit = limitCell !== null && idx === limitCell && !filled;
        const isNext = nextFillCell === idx && !filled;

        const color = filled
          ? inLowZone
            ? "bg-red-500"
            : "bg-emerald-500"
          : isNext
            ? "bg-emerald-500/40"
            : isLimit
              ? "bg-sky-400/50 dark:bg-sky-400/40"
              : "bg-muted-foreground/15";

        return (
          <div
            key={key}
            className={`relative h-2 flex-1 rounded-[2px] transition-colors duration-300 ${color}`}
          >
            {isNext && (
              <span className="absolute inset-0 rounded-[2px] bg-emerald-500/70 animate-ping-sm" />
            )}
          </div>
        );
      })}
    </div>
  );
}
