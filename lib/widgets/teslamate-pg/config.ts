import type { WidgetConfig } from "@/lib/config/schema";

export type TeslamatePgWidgetConfig = WidgetConfig & {
  car_id?: string | number;
};

export function resolveCarId(config: TeslamatePgWidgetConfig): number {
  if (config.car_id == null) return 1;
  const n = Number(config.car_id);
  if (!Number.isInteger(n) || n <= 0) return 1;
  return n;
}
