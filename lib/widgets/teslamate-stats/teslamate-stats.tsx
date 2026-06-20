import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getTeslaStats } from "./query";
import { TeslamateStatsLive } from "./teslamate-stats-live";

export async function TeslamateStatsWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getTeslaStats(carId);
    return (
      <TeslamateStatsLive
        carId={carId}
        title={config.title ?? "Tesla stats"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-stats] query failed", msg);
    return (
      <TeslamateStatsLive
        carId={carId}
        title={config.title ?? "Tesla stats"}
        initial={null}
      />
    );
  }
}
