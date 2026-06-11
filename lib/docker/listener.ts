import { cpuPercentage, getContainerStats, getNetworkStats } from "./proxy";
import type { LiveStatsData, LiveStatsListener } from "./types";

const SAMPLE_INTERVAL_MS = 2000;

type Channel = {
  timer: NodeJS.Timeout | null;
  latest: LiveStatsData | null;
  listeners: Set<LiveStatsListener>;
};

declare global {
  var __dashContainerStatsChannels: Map<string, Channel> | undefined;
}

globalThis.__dashContainerStatsChannels ??= new Map();
const channels = globalThis.__dashContainerStatsChannels;

async function tick(id: string): Promise<void> {
  const channel = channels.get(id);
  if (!channel) return;
  try {
    const stats = await getContainerStats(id, { oneShot: false });
    const current = channels.get(id);
    if (!current) return;
    const net = getNetworkStats(stats);
    const live: LiveStatsData = {
      cpu: cpuPercentage(stats),
      memUsed: stats.memory_stats?.usage ?? 0,
      memLimit: stats.memory_stats?.limit ?? 0,
      cores: stats.cpu_stats?.online_cpus ?? 1,
      netRx: net.rx,
      netTx: net.tx,
    };
    current.latest = live;
    for (const listener of current.listeners) {
      try {
        listener(live);
      } catch {
        // listeners must not break the sampler
      }
    }
  } catch {
    // container may have stopped or proxy unreachable - keep polling
  }
  const next = channels.get(id);
  if (!next) return;
  next.timer = setTimeout(() => {
    void tick(id);
  }, SAMPLE_INTERVAL_MS);
}

export function subscribeToContainerStats(
  id: string,
  listener: LiveStatsListener,
): () => void {
  let channel = channels.get(id);
  if (!channel) {
    channel = { timer: null, latest: null, listeners: new Set() };
    channels.set(id, channel);
    void tick(id);
  }
  channel.listeners.add(listener);
  if (channel.latest) listener(channel.latest);

  return () => {
    const current = channels.get(id);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      if (current.timer) clearTimeout(current.timer);
      channels.delete(id);
    }
  };
}
