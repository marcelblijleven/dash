import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getTpms } from "./query";
import { TeslamateTpmsLive } from "./teslamate-tpms-live";

export async function TeslamateTpmsWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getTpms(carId);
    return (
      <TeslamateTpmsLive
        carId={carId}
        title={config.title ?? "Tyre pressure"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-tpms] query failed", msg);
    return (
      <TeslamateTpmsLive
        carId={carId}
        title={config.title ?? "Tyre pressure"}
        initial={null}
      />
    );
  }
}
