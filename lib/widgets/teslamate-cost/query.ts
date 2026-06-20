import { query } from "@/lib/teslamate/postgres";

export type CostMonth = {
  month: string;
  homeKwh: number;
  homeCost: number;
  publicKwh: number;
  publicCost: number;
  sessions: number;
};

export type CostData = {
  months: CostMonth[];
  currency: string | null;
};

const COST_SQL = `
SELECT
  date_trunc('month', start_date)::date AS month,
  CASE WHEN geofence_id IS NOT NULL THEN 'home' ELSE 'public' END AS kind,
  SUM(charge_energy_added)::float AS kwh,
  SUM(COALESCE(cost, 0))::float AS cost,
  COUNT(*)::int AS sessions
FROM charging_processes
WHERE car_id = $1
  AND charge_energy_added IS NOT NULL
  AND start_date > NOW() - INTERVAL '6 months'
GROUP BY month, kind
ORDER BY month
`;

const SETTINGS_SQL = `SELECT currency FROM settings LIMIT 1`;

type CostRow = {
  month: Date;
  kind: "home" | "public";
  kwh: number;
  cost: number;
  sessions: number;
};

type SettingsRow = { currency: string | null };

export async function getCost(carId: number): Promise<CostData> {
  const [rows, settings] = await Promise.all([
    query<CostRow>(COST_SQL, [carId]),
    query<SettingsRow>(SETTINGS_SQL).catch(() => null),
  ]);

  const byMonth = new Map<string, CostMonth>();
  for (const r of rows.rows) {
    const key = r.month.toISOString().slice(0, 7);
    let entry = byMonth.get(key);
    if (!entry) {
      entry = {
        month: key,
        homeKwh: 0,
        homeCost: 0,
        publicKwh: 0,
        publicCost: 0,
        sessions: 0,
      };
      byMonth.set(key, entry);
    }
    if (r.kind === "home") {
      entry.homeKwh += r.kwh;
      entry.homeCost += r.cost;
    } else {
      entry.publicKwh += r.kwh;
      entry.publicCost += r.cost;
    }
    entry.sessions += r.sessions;
  }

  return {
    months: Array.from(byMonth.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    ),
    currency: settings?.rows[0]?.currency ?? null,
  };
}
