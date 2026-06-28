import { Card, CardContent } from "@/components/ui/card";
import { getDownloadSnapshot } from "@/lib/download/client";
import {
  clampLimit,
  defaultDownloadTitle,
  type DownloadWidgetConfig,
  resolveDownloadConfig,
} from "./config";
import { DownloadClientLive } from "./download-client-live";

export async function DownloadClientWidget({
  config,
}: {
  config: DownloadWidgetConfig;
}) {
  const resolved = resolveDownloadConfig(config);
  if ("error" in resolved) {
    return (
      <Card className="h-full border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm">
          <div className="font-medium text-amber-700 dark:text-amber-300">
            Download widget misconfigured
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {resolved.error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const title =
    config.title ?? defaultDownloadTitle(resolved.connection.client);
  const limit = clampLimit(config.limit);

  try {
    const initial = await getDownloadSnapshot(resolved.connection);
    return (
      <DownloadClientLive
        widgetId={config.id}
        title={title}
        initial={initial}
        limit={limit}
      />
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      `[dash:download-client] ${config.id} initial fetch failed`,
      msg,
    );
    return (
      <DownloadClientLive
        widgetId={config.id}
        title={title}
        initial={null}
        limit={limit}
      />
    );
  }
}
