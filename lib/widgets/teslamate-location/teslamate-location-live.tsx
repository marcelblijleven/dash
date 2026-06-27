"use client";

import { RelativeTime } from "@/components/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/widget-card";
import { usePoll } from "@/lib/widgets/teslamate-pg/use-poll";
import type { LastLocation } from "./query";

export function TeslamateLocationLive({
  carId,
  title,
  initial,
}: {
  carId: number;
  title: string;
  initial: LastLocation | null;
}) {
  const { data, status, updatedAt } = usePoll<LastLocation>(
    `/api/widgets/teslamate-pg/location/${carId}`,
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
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      ) : data.lat === null || data.lon === null ? (
        <div className="text-sm text-muted-foreground">
          no position recorded
        </div>
      ) : (
        <Body data={data} />
      )}
    </WidgetCard>
  );
}

function Body({ data }: { data: LastLocation }) {
  const lat = data.lat as number;
  const lon = data.lon as number;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;

  return (
    <div className="space-y-2 text-sm">
      <a
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        className="font-mono tabular-nums text-primary hover:underline"
      >
        {lat.toFixed(5)}, {lon.toFixed(5)}
      </a>
      <div className="flex gap-4 text-xs text-muted-foreground tabular-nums">
        {data.soc !== null && <span>{data.soc}% battery</span>}
        {data.outsideTemp !== null && (
          <span>{data.outsideTemp.toFixed(0)}&deg;C outside</span>
        )}
      </div>
    </div>
  );
}
