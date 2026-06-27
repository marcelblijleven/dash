import { query } from "@/lib/teslamate/postgres";

export type Odometer = {
  odometerKm: number | null;
  at: string | null;
};

const SQL = `
SELECT odometer::float AS odometer, date
FROM positions
WHERE car_id = $1 AND odometer IS NOT NULL
ORDER BY date DESC
LIMIT 1
`;

type Row = {
  odometer: number;
  date: Date;
};

export async function getOdometer(carId: number): Promise<Odometer> {
  const { rows } = await query<Row>(SQL, [carId]);
  const r = rows[0];
  if (!r) return { odometerKm: null, at: null };
  return { odometerKm: r.odometer, at: r.date.toISOString() };
}
