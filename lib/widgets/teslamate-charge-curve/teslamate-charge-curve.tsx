import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getChargeCurve } from "./query";
import { TeslamateChargeCurveLive } from "./teslamate-charge-curve-live";

export async function TeslamateChargeCurveWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getChargeCurve(carId);
    return (
      <TeslamateChargeCurveLive
        carId={carId}
        title={config.title ?? "Charging curve"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-charge-curve] query failed", msg);
    return (
      <TeslamateChargeCurveLive
        carId={carId}
        title={config.title ?? "Charging curve"}
        initial={null}
      />
    );
  }
}
