export const WIDGET_TYPES = [
  "host-stats",
  "host-chart",
  "host-stat-load",
  "host-stat-memory",
  "host-stat-uptime",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];
