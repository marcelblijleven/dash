import type { WidgetConfig } from "@/lib/config/schema";
import type { TeslamateConnection } from "@/lib/teslamate/mqtt";

export type TeslamateWidgetConfig = WidgetConfig & {
  car_id?: string | number;
  mqtt_url?: string;
  mqtt_username?: string;
  mqtt_password?: string;
  topic_prefix?: string;
};

export type ResolvedTeslamate = {
  carId: string;
  connection: TeslamateConnection;
};

export function resolveTeslamateConfig(
  config: TeslamateWidgetConfig,
): ResolvedTeslamate | { error: string } {
  if (!config.mqtt_url) {
    return { error: "mqtt_url is required for teslamate widgets" };
  }
  const carId = config.car_id != null ? String(config.car_id) : "1";

  return {
    carId,
    connection: {
      mqttUrl: config.mqtt_url,
      username: config.mqtt_username,
      password: config.mqtt_password,
      topicPrefix: config.topic_prefix ?? "teslamate",
    },
  };
}
