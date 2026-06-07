import { NextResponse } from "next/server";
import { getHostStats } from "@/lib/host";
import { getHostSamples } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const host = await getHostStats();

  return NextResponse.json({
    uptime: host?.uptime ?? null,
    loadAvg: host?.loadAvg ?? null,
    memTotal: host?.memTotal ?? null,
    memAvailable: host?.memAvailable ?? null,
    ncpu: null, // TODO: get from docker>
    samples: getHostSamples(),
  });
}
