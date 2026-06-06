export const WIDGET_TYPES = ["host-stats"] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];
