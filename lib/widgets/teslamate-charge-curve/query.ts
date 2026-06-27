import { query } from "@/lib/teslamate/postgres";

export type ChargeCurvePoint = {
  soc: number;
  kw: number;
};

export type ChargeCurve = {
  points: ChargeCurvePoint[];
  peakKw: number | null;
  socStart: number | null;
  socEnd: number | null;
  energyKwh: number | null;
  startedAt: string | null;
};

const META_SQL = `
SELECT
  id,
  start_date,
  start_battery_level,
  end_battery_level,
  charge_energy_added
FROM charging_processes
WHERE car_id = $1 AND charge_energy_added IS NOT NULL
ORDER BY start_date DESC
LIMIT 1
`;

// Peak power per battery level across the most recent charging session,
// giving the characteristic power-vs-SoC charging curve.
const CURVE_SQL = `
SELECT
  battery_level::int AS soc,
  MAX(charger_power)::float AS kw
FROM charges
WHERE charging_process_id = $1 AND charger_power IS NOT NULL
GROUP BY battery_level
ORDER BY soc
`;

type MetaRow = {
  id: number;
  start_date: Date;
  start_battery_level: number | null;
  end_battery_level: number | null;
  charge_energy_added: number | null;
};

type CurveRow = {
  soc: number;
  kw: number;
};

export async function getChargeCurve(carId: number): Promise<ChargeCurve> {
  const meta = await query<MetaRow>(META_SQL, [carId]);
  const m = meta.rows[0];
  if (!m) {
    return {
      points: [],
      peakKw: null,
      socStart: null,
      socEnd: null,
      energyKwh: null,
      startedAt: null,
    };
  }

  const { rows } = await query<CurveRow>(CURVE_SQL, [m.id]);
  const points = rows.map((r) => ({ soc: r.soc, kw: r.kw }));
  const peakKw =
    points.length > 0 ? points.reduce((mx, p) => Math.max(mx, p.kw), 0) : null;

  return {
    points,
    peakKw,
    socStart: m.start_battery_level,
    socEnd: m.end_battery_level,
    energyKwh: m.charge_energy_added,
    startedAt: m.start_date.toISOString(),
  };
}
