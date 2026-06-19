import { Card, CardContent } from "@/components/ui/card";
import { getTeslaState } from "@/lib/teslamate/mqtt";
import { resolveTeslamateConfig, type TeslamateWidgetConfig } from "./config";
import { TeslamateLive } from "./teslamate-live";

export async function TeslamateWidget({
  config,
}: {
  config: TeslamateWidgetConfig;
}) {
  const resolved = resolveTeslamateConfig(config);
  if ("error" in resolved) {
    return (
      <Card className="h-full border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm">
          <div className="font-medium text-amber-700 dark:text-amber-300">
            Teslamate widget misconfigured
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {resolved.error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const initial = await getTeslaState(resolved.connection, resolved.carId);
  const title = config.title ?? "";

  return (
    <TeslamateLive carId={resolved.carId} title={title} initial={initial} />
  );
}
