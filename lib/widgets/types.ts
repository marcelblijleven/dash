export const WIDGET_TYPES = [
  "host-stats",
  "host-chart",
  "host-stat-load",
  "host-stat-memory",
  "host-stat-uptime",
  "teslamate",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];
