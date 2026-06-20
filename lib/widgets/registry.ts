import type { ComponentType } from "react";
import type { WidgetConfig } from "@/lib/config/schema";
import { HostChartWidget } from "@/lib/widgets/host-chart/host-chart";
import {
  HostLoadWidget,
  HostMemoryWidget,
  HostUptimeWidget,
} from "@/lib/widgets/host-stat";
import { HostStatsWidget } from "@/lib/widgets/host-stats/host-stats";
import { TeslamateWidget } from "@/lib/widgets/teslamate";
import { TeslamateCostWidget } from "@/lib/widgets/teslamate-cost";
import { TeslamateEfficiencyWidget } from "@/lib/widgets/teslamate-efficiency";
import { TeslamateRecentWidget } from "@/lib/widgets/teslamate-recent";
import { TeslamateStatsWidget } from "@/lib/widgets/teslamate-stats";
import type { WidgetType } from "@/lib/widgets/types";

export type WidgetComponent = ComponentType<{ config: WidgetConfig }>;

export const widgetRegistry: Record<WidgetType, WidgetComponent> = {
  "host-stats": HostStatsWidget,
  "host-chart": HostChartWidget,
  "host-stat-load": HostLoadWidget,
  "host-stat-memory": HostMemoryWidget,
  "host-stat-uptime": HostUptimeWidget,
  teslamate: TeslamateWidget,
  "teslamate-stats": TeslamateStatsWidget,
  "teslamate-recent": TeslamateRecentWidget,
  "teslamate-efficiency": TeslamateEfficiencyWidget,
  "teslamate-cost": TeslamateCostWidget,
};
