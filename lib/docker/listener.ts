import type { LiveStatsListener } from "./types";

declare global {
  var __dashDockerLiveStatsListeners: Set<LiveStatsListener> | undefined;
}

globalThis.__dashDockerLiveStatsListeners ??= new Set();
const liveStatsListener = globalThis.__dashDockerLiveStatsListeners;

export function subribeToDockerStats(listener: LiveStatsListener): () => void {
  liveStatsListener.add(listener);
  return () => {
    liveStatsListener.delete(listener);
  };
}
