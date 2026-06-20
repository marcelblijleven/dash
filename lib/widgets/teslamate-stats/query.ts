import { query } from "@/lib/teslamate/postgres";

export type TeslaStats = {
  lifetime: {
    km: number;
    kwh: number;
    cost: number;
  };
  last30d: {
    km: number;
    kwh: number;
    cost: number;
  };
  costCurrency: string | null;
};

const STATS_SQL = `
SELECT
  COALESCE((SELECT SUM(distance) FROM drives WHERE car_id = $1), 0)::float AS total_km,
  COALESCE((SELECT SUM(charge_energy_added) FROM charging_processes WHERE car_id = $1), 0)::float AS total_kwh,
  COALESCE((SELECT SUM(cost) FROM charging_processes WHERE car_id = $1 AND cost IS NOT NULL), 0)::float AS total_cost,
  COALESCE((SELECT SUM(distance) FROM drives WHERE car_id = $1 AND start_date > NOW() - INTERVAL '30 days'), 0)::float AS km_30d,
  COALESCE((SELECT SUM(charge_energy_added) FROM charging_processes WHERE car_id = $1 AND start_date > NOW() - INTERVAL '30 days'), 0)::float AS kwh_30d,
  COALESCE((SELECT SUM(cost) FROM charging_processes WHERE car_id = $1 AND cost IS NOT NULL AND start_date > NOW() - INTERVAL '30 days'), 0)::float AS cost_30d
`;

const SETTINGS_SQL = `
SELECT base_unit_of_distance, currency
FROM settings
LIMIT 1
`;

type StatsRow = {
  total_km: number;
  total_kwh: number;
  total_cost: number;
  km_30d: number;
  kwh_30d: number;
  cost_30d: number;
};

type SettingsRow = {
  base_unit_of_distance: string | null;
  currency: string | null;
};

export async function getTeslaStats(carId: number): Promise<TeslaStats> {
  const [stats, settings] = await Promise.all([
    query<StatsRow>(STATS_SQL, [carId]),
    query<SettingsRow>(SETTINGS_SQL).catch(() => null),
  ]);
  const row = stats.rows[0];
  const currency = settings?.rows[0]?.currency ?? null;

  return {
    lifetime: {
      km: row.total_km,
      kwh: row.total_kwh,
      cost: row.total_cost,
    },
    last30d: {
      km: row.km_30d,
      kwh: row.kwh_30d,
      cost: row.cost_30d,
    },
    costCurrency: currency,
  };
}
