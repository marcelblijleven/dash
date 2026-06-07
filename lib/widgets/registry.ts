import type { ComponentType } from "react";
import type { WidgetConfig } from "@/lib/config/schema";
import { HostStatsWidget } from "./host-stats/host-stats";
import type { WidgetType } from "./types";

export type WidgetComponent = ComponentType<{ config: WidgetConfig }>;

export const widgetRegistry: Record<WidgetType, WidgetComponent> = {
  "host-stats": HostStatsWidget,
};
