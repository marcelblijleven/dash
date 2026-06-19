import type { MqttClient } from "mqtt";

export type TeslaState = {
  carId: string;
  displayName: string | null;
  state: string | null;
  since: string | null;
  batteryLevel: number | null;
  usableBatteryLevel: number | null;
  chargeLimitSoc: number | null;
  estBatteryRangeKm: number | null;
  ratedBatteryRangeKm: number | null;
  chargingState: string | null;
  chargerPower: number | null;
  timeToFullCharge: number | null;
  pluggedIn: boolean | null;
  geofence: string | null;
  speed: number | null;
  odometer: number | null;
  insideTemp: number | null;
  outsideTemp: number | null;
  updateAvailable: boolean | null;
  updatedAt: number;
};

export type TeslamateConnection = {
  mqttUrl: string;
  username?: string;
  password?: string;
  topicPrefix: string;
};

type Listener = (state: TeslaState) => void;

type Broker = {
  client: MqttClient | null;
  connecting: Promise<void> | null;
  cars: Map<string, TeslaState>;
  listeners: Map<string, Set<Listener>>;
  topicPrefix: string;
};

declare global {
  var __dashTeslaBrokers: Map<string, Broker> | undefined;
}

globalThis.__dashTeslaBrokers ??= new Map();
const brokers = globalThis.__dashTeslaBrokers;

function brokerKey(conn: TeslamateConnection): string {
  return `${conn.mqttUrl}|${conn.username ?? ""}|${conn.topicPrefix}`;
}

function emptyState(carId: string): TeslaState {
  return {
    carId,
    displayName: null,
    state: null,
    since: null,
    batteryLevel: null,
    usableBatteryLevel: null,
    chargeLimitSoc: null,
    estBatteryRangeKm: null,
    ratedBatteryRangeKm: null,
    chargingState: null,
    chargerPower: null,
    timeToFullCharge: null,
    pluggedIn: null,
    geofence: null,
    speed: null,
    odometer: null,
    insideTemp: null,
    outsideTemp: null,
    updateAvailable: null,
    updatedAt: 0,
  };
}

function parseNumber(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseBool(value: string): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function applyField(state: TeslaState, field: string, value: string): boolean {
  switch (field) {
    case "display_name":
      state.displayName = value || null;
      return true;
    case "state":
      state.state = value || null;
      return true;
    case "since":
      state.since = value || null;
      return true;
    case "battery_level":
      state.batteryLevel = parseNumber(value);
      return true;
    case "usable_battery_level":
      state.usableBatteryLevel = parseNumber(value);
      return true;
    case "charge_limit_soc":
      state.chargeLimitSoc = parseNumber(value);
      return true;
    case "est_battery_range_km":
      state.estBatteryRangeKm = parseNumber(value);
      return true;
    case "rated_battery_range_km":
      state.ratedBatteryRangeKm = parseNumber(value);
      return true;
    case "charging_state":
      state.chargingState = value || null;
      return true;
    case "charger_power":
      state.chargerPower = parseNumber(value);
      return true;
    case "time_to_full_charge":
      state.timeToFullCharge = parseNumber(value);
      return true;
    case "plugged_in":
      state.pluggedIn = parseBool(value);
      return true;
    case "geofence":
      state.geofence = value || null;
      return true;
    case "speed":
      state.speed = parseNumber(value);
      return true;
    case "odometer":
      state.odometer = parseNumber(value);
      return true;
    case "inside_temp":
      state.insideTemp = parseNumber(value);
      return true;
    case "outside_temp":
      state.outsideTemp = parseNumber(value);
      return true;
    case "update_available":
      state.updateAvailable = parseBool(value);
      return true;
    default:
      return false;
  }
}

function broadcast(broker: Broker, carId: string, state: TeslaState): void {
  const listeners = broker.listeners.get(carId);
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      listener(state);
    } catch {
      // listeners must not break the broker
    }
  }
}

async function ensureBroker(conn: TeslamateConnection): Promise<Broker> {
  const key = brokerKey(conn);
  let broker = brokers.get(key);
  if (!broker) {
    broker = {
      client: null,
      connecting: null,
      cars: new Map(),
      listeners: new Map(),
      topicPrefix: conn.topicPrefix,
    };
    brokers.set(key, broker);
  }
  if (broker.client) return broker;
  if (broker.connecting) {
    await broker.connecting;
    return broker;
  }

  broker.connecting = (async () => {
    const { default: mqtt } = await import("mqtt");
    console.log(
      `[dash:teslamate] connecting to ${conn.mqttUrl} (prefix=${conn.topicPrefix})`,
    );
    const client = mqtt.connect(conn.mqttUrl, {
      username: conn.username,
      password: conn.password,
      reconnectPeriod: 5000,
      clientId: `dash-${Math.random().toString(16).slice(2, 10)}`,
    });

    const prefix = conn.topicPrefix;
    const carTopic = new RegExp(`^${prefix}/cars/([^/]+)/(.+)$`);
    const b = broker as Broker;
    let messageCount = 0;

    client.on("connect", () => {
      const topic = `${prefix}/cars/+/+`;
      console.log(`[dash:teslamate] connected, subscribing to ${topic}`);
      client.subscribe(topic, (err, granted) => {
        if (err) {
          console.error("[dash:teslamate] subscribe failed", err);
        } else {
          console.log(
            `[dash:teslamate] subscribed: ${granted?.map((g) => `${g.topic} qos=${g.qos}`).join(", ")}`,
          );
        }
      });
    });

    client.on("reconnect", () => {
      console.log("[dash:teslamate] reconnecting…");
    });

    client.on("close", () => {
      console.log("[dash:teslamate] connection closed");
    });

    client.on("message", (topic, payload) => {
      const match = topic.match(carTopic);
      if (!match) {
        if (messageCount < 5) {
          console.log(
            `[dash:teslamate] received unmatched topic: ${topic} (expected prefix=${prefix})`,
          );
        }
        return;
      }
      const [, carId, field] = match;
      const value = payload.toString("utf8");

      if (messageCount < 10) {
        console.log(
          `[dash:teslamate] car=${carId} ${field}=${value.slice(0, 40)}`,
        );
      }
      messageCount++;

      const existing = b.cars.get(carId) ?? emptyState(carId);
      const changed = applyField(existing, field, value);
      if (!changed) return;

      existing.updatedAt = Date.now();
      b.cars.set(carId, existing);
      broadcast(b, carId, existing);
    });

    client.on("error", (err) => {
      console.error("[dash:teslamate] mqtt error", err.message);
    });

    b.client = client;
  })();

  try {
    await broker.connecting;
  } finally {
    broker.connecting = null;
  }
  return broker;
}

export async function getTeslaState(
  conn: TeslamateConnection,
  carId: string,
): Promise<TeslaState | null> {
  const broker = await ensureBroker(conn);
  return broker.cars.get(carId) ?? null;
}

export async function subscribeTeslaState(
  conn: TeslamateConnection,
  carId: string,
  listener: Listener,
): Promise<() => void> {
  const broker = await ensureBroker(conn);
  let set = broker.listeners.get(carId);
  if (!set) {
    set = new Set();
    broker.listeners.set(carId, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set?.size === 0) broker.listeners.delete(carId);
  };
}
