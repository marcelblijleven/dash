export const WIDGET_TYPES = [
  "host-stats",
  "host-chart",
  "host-stat-load",
  "host-stat-memory",
  "host-stat-uptime",
  "teslamate",
  "teslamate-stats",
  "teslamate-recent",
  "teslamate-efficiency",
  "teslamate-cost",
  "arr",
  "docker-stats",
  "traefik-status",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];
