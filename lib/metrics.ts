import { getHostStats } from "./host";

export type HostSample = {
  t: number;
  loadAvg: [number, number, number] | null;
  memUsed: number | null;
  memTotal: number | null;
  ncpu: number | null;
};

export type HostSnapshot = {
  uptime: number | null;
  loadAvg: [number, number, number] | null;
  memTotal: number | null;
  memAvailable: number | null;
  ncpu: number | null;
  samples: HostSample[];
};

type Listener = (snapshot: HostSnapshot) => void;

const SAMPLE_INTERVAL_MS = 5000;
const MAX_SAMPLES = 60;

declare global {
  var __dashHostSamples: HostSample[] | undefined;
  var __dashHostSamplerInterval: NodeJS.Timeout | undefined;
  var __dashHostLatest: HostSnapshot | undefined;
  var __dashHostListeners: Set<Listener> | undefined;
  var __dashHostTick: (() => Promise<void>) | undefined;
}

// TODO: maybe but this in a database?
globalThis.__dashHostSamples ??= [];
globalThis.__dashHostListeners ??= new Set();
const samples = globalThis.__dashHostSamples;
const listeners = globalThis.__dashHostListeners;

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

    const snapshot: HostSnapshot = {
      uptime: host?.uptime ?? null,
      loadAvg: host?.loadAvg ?? null,
      memTotal: host?.memTotal ?? null,
      memAvailable: host?.memAvailable ?? null,
      ncpu: null,
      samples: samples.slice(),
    };
    globalThis.__dashHostLatest = snapshot;
    for (const listener of listeners) {
      try {
        listener(snapshot);
      } catch {
        // listeners must not break the sampler
      }
    }
  } catch {
    // Do nothing?
  }
}

globalThis.__dashHostTick = tick;

function ensureSampler(): void {
  if (globalThis.__dashHostSamplerInterval) return;
  void globalThis.__dashHostTick?.();
  globalThis.__dashHostSamplerInterval = setInterval(() => {
    void globalThis.__dashHostTick?.();
  }, SAMPLE_INTERVAL_MS);
}

export function getHostSamples(): HostSample[] {
  ensureSampler();
  return samples;
}

export function getLatestHostSnapshot(): HostSnapshot | null {
  ensureSampler();
  return globalThis.__dashHostLatest ?? null;
}

export function subscribeHostSnapshot(listener: Listener): () => void {
  ensureSampler();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
