import type { WidgetConfig } from "@/lib/config/schema";

export type TeslamateWidgetConfig = WidgetConfig & {
  car_id?: string | number;
};

export function resolveCarId(config: TeslamateWidgetConfig): string {
  return config.car_id != null ? String(config.car_id) : "1";
}
