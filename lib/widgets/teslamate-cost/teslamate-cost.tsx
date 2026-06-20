import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getCost } from "./query";
import { TeslamateCostLive } from "./teslamate-cost-live";

export async function TeslamateCostWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getCost(carId);
    return (
      <TeslamateCostLive
        carId={carId}
        title={config.title ?? "Charging cost"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-cost] query failed", msg);
    return (
      <TeslamateCostLive
        carId={carId}
        title={config.title ?? "Charging cost"}
        initial={null}
      />
    );
  }
}
