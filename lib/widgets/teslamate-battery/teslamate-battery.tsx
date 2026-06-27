import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getBatteryHealth } from "./query";
import { TeslamateBatteryLive } from "./teslamate-battery-live";

export async function TeslamateBatteryWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getBatteryHealth(carId);
    return (
      <TeslamateBatteryLive
        carId={carId}
        title={config.title ?? "Battery health"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-battery] query failed", msg);
    return (
      <TeslamateBatteryLive
        carId={carId}
        title={config.title ?? "Battery health"}
        initial={null}
      />
    );
  }
}
