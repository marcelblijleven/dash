import { WidgetCard } from "@/components/widget-card"
import { WidgetConfig } from "@/lib/config"

export async function HostStatsWidget({ config }: { config: WidgetConfig }) {
  const initial = {
    uptime: 0,
    loadAvg: 0,
    memTotal: 0,
    memAvailable: 0,
    ncpu: 0,
  }

  return (
    <WidgetCard title={config.title ?? 'Host'}>
      <>{initial}</>
    </WidgetCard>
  )
}
