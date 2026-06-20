import { Card, CardContent } from "@/components/ui/card";
import { getArrSnapshot } from "@/lib/arr/client";
import { ArrLive } from "./arr-live";
import {
  type ArrWidgetConfig,
  clampLimit,
  defaultTitle,
  resolveArrConfig,
} from "./config";

export async function ArrWidget({ config }: { config: ArrWidgetConfig }) {
  const resolved = resolveArrConfig(config);
  if ("error" in resolved) {
    return (
      <Card className="h-full border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm">
          <div className="font-medium text-amber-700 dark:text-amber-300">
            *arr widget misconfigured
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {resolved.error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const title = config.title ?? defaultTitle(resolved.connection.service);
  const limit = clampLimit(config.limit);

  try {
    const initial = await getArrSnapshot(resolved.connection);
    return (
      <ArrLive
        widgetId={config.id}
        title={title}
        initial={initial}
        limit={limit}
      />
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[dash:arr] ${config.id} initial fetch failed`, msg);
    return (
      <ArrLive
        widgetId={config.id}
        title={title}
        initial={null}
        limit={limit}
      />
    );
  }
}
