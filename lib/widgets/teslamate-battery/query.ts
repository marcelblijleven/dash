import { query } from "@/lib/teslamate/postgres";

export type BatteryPoint = {
  week: string;
  rangeKm: number;
};

export type BatteryHealth = {
  points: BatteryPoint[];
  currentRangeKm: number | null;
  maxRangeKm: number | null;
  degradationPct: number | null;
};

// Projects each charge's rated range up to a full 100% charge
// (rated range scales linearly with state of charge). Charges that ended
// below 50% are excluded because the projection gets noisy at low SoC.
const SQL = `
SELECT
  date_trunc('week', start_date)::date AS week,
  AVG(end_rated_range_km / NULLIF(end_battery_level, 0) * 100)::float AS range_km
FROM charging_processes
WHERE car_id = $1
  AND end_battery_level >= 50
  AND end_rated_range_km IS NOT NULL
GROUP BY week
HAVING COUNT(*) > 0
ORDER BY week
`;

type Row = {
  week: Date;
  range_km: number;
};

export async function getBatteryHealth(carId: number): Promise<BatteryHealth> {
  const { rows } = await query<Row>(SQL, [carId]);
  const points: BatteryPoint[] = rows.map((r) => ({
    week: r.week.toISOString().slice(0, 10),
    rangeKm: r.range_km,
  }));

  if (points.length === 0) {
    return {
      points,
      currentRangeKm: null,
      maxRangeKm: null,
      degradationPct: null,
    };
  }

  const currentRangeKm = points[points.length - 1].rangeKm;
  const maxRangeKm = points.reduce((m, p) => Math.max(m, p.rangeKm), 0);
  const degradationPct =
    maxRangeKm > 0 ? (1 - currentRangeKm / maxRangeKm) * 100 : null;

  return { points, currentRangeKm, maxRangeKm, degradationPct };
}
