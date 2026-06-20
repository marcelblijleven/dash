import { query } from "@/lib/teslamate/postgres";

export type RecentMode = "drives" | "charges";

export type RecentDrive = {
  kind: "drive";
  id: number;
  startedAt: string;
  endedAt: string;
  distanceKm: number;
  durationMin: number | null;
  endLabel: string | null;
};

export type RecentCharge = {
  kind: "charge";
  id: number;
  startedAt: string;
  endedAt: string;
  durationMin: number | null;
  energyKwh: number;
  cost: number | null;
  startSoc: number | null;
  endSoc: number | null;
  label: string | null;
};

export type RecentItem = RecentDrive | RecentCharge;

const DRIVES_SQL = `
SELECT
  d.id,
  d.start_date,
  d.end_date,
  d.distance,
  d.duration_min,
  COALESCE(eg.name, ea.display_name) AS end_label
FROM drives d
LEFT JOIN addresses ea ON ea.id = d.end_address_id
LEFT JOIN geofences eg ON eg.id = d.end_geofence_id
WHERE d.car_id = $1 AND d.distance IS NOT NULL
ORDER BY d.start_date DESC
LIMIT $2
`;

const CHARGES_SQL = `
SELECT
  cp.id,
  cp.start_date,
  cp.end_date,
  cp.duration_min,
  cp.charge_energy_added,
  cp.cost,
  cp.start_battery_level,
  cp.end_battery_level,
  COALESCE(g.name, a.display_name) AS label
FROM charging_processes cp
LEFT JOIN addresses a ON a.id = cp.address_id
LEFT JOIN geofences g ON g.id = cp.geofence_id
WHERE cp.car_id = $1 AND cp.charge_energy_added IS NOT NULL
ORDER BY cp.start_date DESC
LIMIT $2
`;

type DriveRow = {
  id: number;
  start_date: Date;
  end_date: Date;
  distance: number;
  duration_min: number | null;
  end_label: string | null;
};

type ChargeRow = {
  id: number;
  start_date: Date;
  end_date: Date;
  duration_min: number | null;
  charge_energy_added: number;
  cost: string | null;
  start_battery_level: number | null;
  end_battery_level: number | null;
  label: string | null;
};

export async function getRecent(
  carId: number,
  mode: RecentMode,
  limit: number,
): Promise<RecentItem[]> {
  if (mode === "drives") {
    const { rows } = await query<DriveRow>(DRIVES_SQL, [carId, limit]);
    return rows.map(
      (r): RecentDrive => ({
        kind: "drive",
        id: r.id,
        startedAt: r.start_date.toISOString(),
        endedAt: r.end_date.toISOString(),
        distanceKm: r.distance,
        durationMin: r.duration_min,
        endLabel: r.end_label,
      }),
    );
  }
  const { rows } = await query<ChargeRow>(CHARGES_SQL, [carId, limit]);
  return rows.map(
    (r): RecentCharge => ({
      kind: "charge",
      id: r.id,
      startedAt: r.start_date.toISOString(),
      endedAt: r.end_date.toISOString(),
      durationMin: r.duration_min,
      energyKwh: r.charge_energy_added,
      cost: r.cost !== null ? Number(r.cost) : null,
      startSoc: r.start_battery_level,
      endSoc: r.end_battery_level,
      label: r.label,
    }),
  );
}
