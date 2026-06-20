import { query } from "@/lib/teslamate/postgres";

export type EfficiencyPoint = {
  day: string;
  whPerKm: number;
  km: number;
};

export type EfficiencyData = {
  points: EfficiencyPoint[];
  avgWhPerKm: number | null;
  totalKm: number;
};

const SQL = `
SELECT
  date_trunc('day', d.start_date)::date AS day,
  SUM(d.distance)::float AS km,
  SUM((d.start_rated_range_km - d.end_rated_range_km) * c.efficiency)::float AS kwh
FROM drives d
JOIN cars c ON c.id = d.car_id
WHERE d.car_id = $1
  AND d.start_date > NOW() - INTERVAL '30 days'
  AND d.distance > 1
  AND c.efficiency IS NOT NULL
GROUP BY day
HAVING SUM(d.distance) > 0
ORDER BY day
`;

type Row = {
  day: Date;
  km: number;
  kwh: number;
};

export async function getEfficiency(carId: number): Promise<EfficiencyData> {
  const { rows } = await query<Row>(SQL, [carId]);
  const points: EfficiencyPoint[] = rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    whPerKm: (r.kwh * 1000) / r.km,
    km: r.km,
  }));

  const totalKm = points.reduce((s, p) => s + p.km, 0);
  const totalWh = points.reduce((s, p) => s + p.whPerKm * p.km, 0);
  const avgWhPerKm = totalKm > 0 ? totalWh / totalKm : null;

  return { points, avgWhPerKm, totalKm };
}
