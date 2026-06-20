import {
  resolveCarId,
  type TeslamatePgWidgetConfig,
} from "@/lib/widgets/teslamate-pg/config";
import { PgErrorCard } from "@/lib/widgets/teslamate-pg/error-card";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getRecent, type RecentMode } from "./query";
import { TeslamateRecentLive } from "./teslamate-recent-live";

type Config = TeslamatePgWidgetConfig & {
  mode?: RecentMode;
  limit?: number;
};

export async function TeslamateRecentWidget({ config }: { config: Config }) {
  const carId = resolveCarId(config);
  const mode: RecentMode = config.mode === "charges" ? "charges" : "drives";
  const limit = clampLimit(config.limit);

  try {
    const initial = await getRecent(carId, mode, limit);
    return (
      <TeslamateRecentLive
        carId={carId}
        mode={mode}
        title={
          config.title ??
          (mode === "drives" ? "Recent drives" : "Recent charges")
        }
        initial={initial}
      />
    );
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return <PgErrorCard error={e.message} />;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-recent] query failed", msg);
    return (
      <TeslamateRecentLive
        carId={carId}
        mode={mode}
        title={config.title ?? "Recent"}
        initial={null}
      />
    );
  }
}

function clampLimit(limit: number | undefined): number {
  if (limit == null || !Number.isInteger(limit)) return 3;
  return Math.max(1, Math.min(20, limit));
}
