export function isActivelyReporting(state: string | null): boolean {
  if (state === null) return true;
  return (
    state === "online" ||
    state === "driving" ||
    state === "charging" ||
    state === "updating"
  );
}

export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type ChargingInput = {
  chargerPower: number | null;
  timeToFullCharge: number | null;
  chargeLimitSoc: number | null;
  chargingState: string | null;
};

export function formatCharging(data: ChargingInput): string {
  const parts: string[] = [];
  if (data.chargerPower !== null) parts.push(`${data.chargerPower} kW`);
  if (data.timeToFullCharge !== null && data.timeToFullCharge > 0) {
    const limit = data.chargeLimitSoc;
    const target =
      limit !== null && limit < 100 ? `to ${Math.round(limit)}%` : "to full";
    parts.push(`${formatHours(data.timeToFullCharge)} ${target}`);
  }
  return parts.join(" · ") || (data.chargingState ?? "plugged in");
}

type ClimateInput = {
  insideTemp: number | null;
  outsideTemp: number | null;
};

export function formatClimate(data: ClimateInput): string | null {
  const inside =
    data.insideTemp !== null ? `${data.insideTemp.toFixed(1)}° in` : null;
  const outside =
    data.outsideTemp !== null ? `${data.outsideTemp.toFixed(1)}° out` : null;
  if (inside && outside) return `${inside} · ${outside}`;
  return inside ?? outside;
}

export function formatOdometer(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}
