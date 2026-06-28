import { Card, CardContent } from "@/components/ui/card";
import { getDnsStats } from "@/lib/dns/client";
import {
  type DnsWidgetConfig,
  defaultDnsTitle,
  resolveDnsConfig,
} from "./config";
import { DnsStatsLive } from "./dns-stats-live";

export async function DnsStatsWidget({ config }: { config: DnsWidgetConfig }) {
  const resolved = resolveDnsConfig(config);
  if ("error" in resolved) {
    return (
      <Card className="h-full border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm">
          <div className="font-medium text-amber-700 dark:text-amber-300">
            DNS widget misconfigured
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {resolved.error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const title = config.title ?? defaultDnsTitle(resolved.connection.provider);

  try {
    const initial = await getDnsStats(resolved.connection);
    return (
      <DnsStatsLive widgetId={config.id} title={title} initial={initial} />
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[dash:dns-stats] ${config.id} initial fetch failed`, msg);
    return <DnsStatsLive widgetId={config.id} title={title} initial={null} />;
  }
}
