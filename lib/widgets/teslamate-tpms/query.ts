import { query } from "@/lib/teslamate/postgres";

export type Tpms = {
  fl: number | null;
  fr: number | null;
  rl: number | null;
  rr: number | null;
  at: string | null;
};

// Most recent position that carries any tyre-pressure reading. Pressures
// are stored in bar.
const SQL = `
SELECT
  tpms_pressure_fl::float AS fl,
  tpms_pressure_fr::float AS fr,
  tpms_pressure_rl::float AS rl,
  tpms_pressure_rr::float AS rr,
  date
FROM positions
WHERE car_id = $1
  AND (
    tpms_pressure_fl IS NOT NULL OR tpms_pressure_fr IS NOT NULL
    OR tpms_pressure_rl IS NOT NULL OR tpms_pressure_rr IS NOT NULL
  )
ORDER BY date DESC
LIMIT 1
`;

type Row = {
  fl: number | null;
  fr: number | null;
  rl: number | null;
  rr: number | null;
  date: Date;
};

export async function getTpms(carId: number): Promise<Tpms> {
  const { rows } = await query<Row>(SQL, [carId]);
  const r = rows[0];
  if (!r) {
    return { fl: null, fr: null, rl: null, rr: null, at: null };
  }
  return {
    fl: r.fl,
    fr: r.fr,
    rl: r.rl,
    rr: r.rr,
    at: r.date.toISOString(),
  };
}
