import type { ComponentType } from "react";
import type { WidgetConfig } from "@/lib/config/schema";
import { HostChartWidget } from "@/lib/widgets/host-chart/host-chart";
import { HostStatsWidget } from "@/lib/widgets/host-stats/host-stats";
import type { WidgetType } from "@/lib/widgets/types";

export type WidgetComponent = ComponentType<{ config: WidgetConfig }>;

export const widgetRegistry: Record<WidgetType, WidgetComponent> = {
  "host-stats": HostStatsWidget,
  "host-chart": HostChartWidget,
};
