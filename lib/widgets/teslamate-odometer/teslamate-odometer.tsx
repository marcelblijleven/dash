import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getOdometer } from "./query";
import { TeslamateOdometerLive } from "./teslamate-odometer-live";

export async function TeslamateOdometerWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getOdometer(carId);
    return (
      <TeslamateOdometerLive
        carId={carId}
        title={config.title ?? "Odometer"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-odometer] query failed", msg);
    return (
      <TeslamateOdometerLive
        carId={carId}
        title={config.title ?? "Odometer"}
        initial={null}
      />
    );
  }
}
