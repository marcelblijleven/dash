import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getLastLocation } from "./query";
import { TeslamateLocationLive } from "./teslamate-location-live";

export async function TeslamateLocationWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getLastLocation(carId);
    return (
      <TeslamateLocationLive
        carId={carId}
        title={config.title ?? "Last location"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-location] query failed", msg);
    return (
      <TeslamateLocationLive
        carId={carId}
        title={config.title ?? "Last location"}
        initial={null}
      />
    );
  }
}
