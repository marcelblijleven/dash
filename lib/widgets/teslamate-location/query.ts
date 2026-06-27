import { query } from "@/lib/teslamate/postgres";

export type LastLocation = {
  lat: number | null;
  lon: number | null;
  soc: number | null;
  outsideTemp: number | null;
  at: string | null;
};

const SQL = `
SELECT
  latitude::float AS lat,
  longitude::float AS lon,
  battery_level::int AS soc,
  outside_temp::float AS outside_temp,
  date
FROM positions
WHERE car_id = $1 AND latitude IS NOT NULL AND longitude IS NOT NULL
ORDER BY date DESC
LIMIT 1
`;

type Row = {
  lat: number;
  lon: number;
  soc: number | null;
  outside_temp: number | null;
  date: Date;
};

export async function getLastLocation(carId: number): Promise<LastLocation> {
  const { rows } = await query<Row>(SQL, [carId]);
  const r = rows[0];
  if (!r) {
    return { lat: null, lon: null, soc: null, outsideTemp: null, at: null };
  }
  return {
    lat: r.lat,
    lon: r.lon,
    soc: r.soc,
    outsideTemp: r.outside_temp,
    at: r.date.toISOString(),
  };
}
