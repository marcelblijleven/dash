import { getHostStats } from "./host";

export type HostSample = {
  t: number;
  loadAvg: [number, number, number] | null;
  memUsed: number | null;
  memTotal: number | null;
  ncpu: number | null;
};

const SAMPLE_INTERVAL_MS = 5000;
const MAX_SAMPLES = 60;

declare global {
  var __dashHostSamples: HostSample[] | undefined;
  var __dashHostSamplerInterval: NodeJS.Timeout | undefined;
}

// TODO: maybe but this in a database?
const samples = globalThis.__dashHostSamples
  ? globalThis.__dashHostSamples
  : [];

async function tick(): Promise<void> {
  try {
    const host = await getHostStats();
    samples.push({
      t: Date.now(),
      loadAvg: host?.loadAvg ?? null,
      memUsed: host ? host.memTotal - host.memAvailable : null,
      memTotal: host?.memTotal ?? null,
      ncpu: null,
    });
    while (samples.length > MAX_SAMPLES) samples.shift();
  } catch {
    // Do nothing?
  }
}

function ensureSampler(): void {
  if (globalThis.__dashHostSamplerInterval) return;
  void tick();
  globalThis.__dashHostSamplerInterval = setInterval(tick, SAMPLE_INTERVAL_MS);
}

export function getHostSamples(): HostSample[] {
  ensureSampler();
  return samples;
}
