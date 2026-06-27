import { query } from "@/lib/teslamate/postgres";

export type DrivePerformance = {
  maxSpeedKmh: number | null;
  maxPowerKw: number | null;
  longestKm: number | null;
  driveCount: number;
  totalKm: number;
};

const SQL = `
SELECT
  MAX(speed_max)::float AS max_speed,
  MAX(power_max)::float AS max_power,
  MAX(distance)::float AS longest_km,
  COUNT(*)::int AS drive_count,
  COALESCE(SUM(distance), 0)::float AS total_km
FROM drives
WHERE car_id = $1 AND start_date > NOW() - INTERVAL '30 days'
`;

type Row = {
  max_speed: number | null;
  max_power: number | null;
  longest_km: number | null;
  drive_count: number;
  total_km: number;
};

export async function getDrivePerformance(
  carId: number,
): Promise<DrivePerformance> {
  const { rows } = await query<Row>(SQL, [carId]);
  const r = rows[0];
  return {
    maxSpeedKmh: r.max_speed,
    maxPowerKw: r.max_power,
    longestKm: r.longest_km,
    driveCount: r.drive_count,
    totalKm: r.total_km,
  };
}
