import { Card, CardContent } from "@/components/ui/card";
import {
  getTeslaState,
  TeslamateMqttNotConfigured,
} from "@/lib/teslamate/mqtt";
import { resolveCarId, type TeslamateWidgetConfig } from "./config";
import { TeslamateLive } from "./teslamate-live";

export async function TeslamateWidget({
  config,
}: {
  config: TeslamateWidgetConfig;
}) {
  const carId = resolveCarId(config);
  const title = config.title ?? "";

  try {
    const initial = await getTeslaState(carId);
    return <TeslamateLive carId={carId} title={title} initial={initial} />;
  } catch (e) {
    if (e instanceof TeslamateMqttNotConfigured) {
      return (
        <Card className="h-full border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            <div className="font-medium text-amber-700 dark:text-amber-300">
              Teslamate widget unavailable
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {e.message}
            </div>
          </CardContent>
        </Card>
      );
    }
    throw e;
  }
}
