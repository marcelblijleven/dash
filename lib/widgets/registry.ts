import type { ComponentType } from "react";
import { HostStatsWidget } from "./host-stats";
import type { WidgetType } from "./types";
import type { WidgetConfig } from "../config";

export type WidgetComponent = ComponentType<{ config: WidgetConfig }>;

export const widgetRegistry: Record<WidgetType, WidgetComponent> = {
  "host-stats": HostStatsWidget,
};
