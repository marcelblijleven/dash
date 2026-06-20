import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getEfficiency } from "./query";
import { TeslamateEfficiencyLive } from "./teslamate-efficiency-live";

export async function TeslamateEfficiencyWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getEfficiency(carId);
    return (
      <TeslamateEfficiencyLive
        carId={carId}
        title={config.title ?? "Efficiency"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-efficiency] query failed", msg);
    return (
      <TeslamateEfficiencyLive
        carId={carId}
        title={config.title ?? "Efficiency"}
        initial={null}
      />
    );
  }
}
