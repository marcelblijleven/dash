export const WIDGET_TYPES = ["host-stats", "host-chart"] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];
