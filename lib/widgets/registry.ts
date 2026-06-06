import { ComponentType } from "react"
import { HostStatsWidget } from "./host-stats"
import { WidgetType } from "./types"
import { WidgetConfig } from "../config"

export type WidgetComponent = ComponentType<{ config: WidgetConfig }>

export const widgetRegistry: Record<WidgetType, WidgetComponent> = {
  'host-stats': HostStatsWidget,
}
