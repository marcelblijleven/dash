"use client";

import { RelativeTime } from "@/components/relative-time";
import { Badge } from "@/components/ui/badge";
import { WidgetCard } from "@/components/widget-card";
import type { TeslaState } from "@/lib/teslamate/mqtt";
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

  const hint = (
    <span className="text-xs text-muted-foreground">
      {stale ? (
        <span className="text-amber-600 dark:text-amber-400">stale</span>
      ) : (
        <RelativeTime since={updatedAt} />
      )}
    </span>
  );

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
      <div className="flex items-center gap-4">
        <BatteryBar
          percent={battery}
          limit={data.chargeLimitSoc}
          charging={isCharging}
        />
        <div className="ml-auto flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {battery !== null ? `${Math.round(battery)}%` : "-"}
          </span>
          {range !== null && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {Math.round(range)} km
            </span>
          )}
          {data.updateAvailable === true && (
            <Badge variant="warning">update</Badge>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">State</dt>
        <dd className="text-right">
          <StateLabel state={data.state} since={data.since} />
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
            <dd className="text-right">{data.geofence}</dd>
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

function StateLabel({
  state,
  since,
}: {
  state: string | null;
  since: string | null;
}) {
  if (!state) return <span className="text-muted-foreground">-</span>;
  const color =
    state === "driving"
      ? "text-blue-600 dark:text-blue-400"
      : state === "charging"
        ? "text-green-600 dark:text-green-400"
        : state === "asleep" || state === "offline"
          ? "text-muted-foreground"
          : "";
  const duration = formatSince(since);
  return (
    <span>
      <span className={color}>{state}</span>
      {duration && (
        <span className="text-muted-foreground"> · {duration}</span>
      )}
    </span>
  );
}

function formatSince(since: string | null): string | null {
  if (!since) return null;
  const ts = Date.parse(since);
  if (Number.isNaN(ts)) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatCharging(data: TeslaState): string {
  const parts: string[] = [];
  if (data.chargerPower !== null) parts.push(`${data.chargerPower} kW`);
  if (data.timeToFullCharge !== null && data.timeToFullCharge > 0) {
    parts.push(`${formatHours(data.timeToFullCharge)} to full`);
  }
  return parts.join(" · ") || (data.chargingState ?? "plugged in");
}

function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatClimate(data: TeslaState): string | null {
  const inside =
    data.insideTemp !== null ? `${data.insideTemp.toFixed(1)}° in` : null;
  const outside =
    data.outsideTemp !== null
      ? `${data.outsideTemp.toFixed(1)}° out`
      : null;
  if (inside && outside) return `${inside} · ${outside}`;
  return inside ?? outside;
}

function formatOdometer(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

const CELL_COUNT = 10;
const LOW_ZONE_CELLS = 2;

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
  const limitPct =
    limit !== null ? Math.max(0, Math.min(100, limit)) : null;
  const filledCells = Math.round(pct / (100 / CELL_COUNT));
  const limitCell =
    limitPct !== null ? Math.round(limitPct / (100 / CELL_COUNT)) : null;
  const nextFillCell = charging
    ? Math.min(filledCells + 1, CELL_COUNT)
    : null;

  return (
    <div
      className="flex gap-1"
      aria-label={`battery ${Math.round(pct)}%${
        limitPct !== null ? `, limit ${limitPct}%` : ""
      }`}
    >
      {Array.from({ length: CELL_COUNT }, (_, i) => {
        const idx = i + 1;
        const filled = idx <= filledCells;
        const inLowZone = idx <= LOW_ZONE_CELLS;
        const isLimit = limitCell !== null && idx === limitCell && !filled;
        const isNext = nextFillCell === idx && !filled;

        const color = filled
          ? inLowZone
            ? "bg-red-500"
            : "bg-emerald-500"
          : isLimit
            ? "bg-amber-500/40 dark:bg-amber-500/35"
            : "bg-muted-foreground/15";

        return (
          <div
            key={i}
            className={`h-8 w-4 rounded-[3px] transition-colors duration-300 ${color} ${
              isNext ? "animate-pulse bg-emerald-500/30" : ""
            }`}
          />
        );
      })}
    </div>
  );
}
