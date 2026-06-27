import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getDrivePerformance } from "./query";
import { TeslamatePerformanceLive } from "./teslamate-performance-live";

export async function TeslamatePerformanceWidget({
  config,
}: {
  config: TeslamatePgWidgetConfig;
}) {
  const carId = resolveCarId(config);

  try {
    const initial = await getDrivePerformance(carId);
    return (
      <TeslamatePerformanceLive
        carId={carId}
        title={config.title ?? "Drive performance"}
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-performance] query failed", msg);
    return (
      <TeslamatePerformanceLive
        carId={carId}
        title={config.title ?? "Drive performance"}
        initial={null}
      />
    );
  }
}
