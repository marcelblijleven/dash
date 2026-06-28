import type { DockerContainerItem } from "./docker-containers-live";

export const DEFAULT_CONTAINER_LIMIT = 8;
const CONTAINER_LIMIT_MIN = 1;
const CONTAINER_LIMIT_MAX = 50;

export function clampLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_CONTAINER_LIMIT;
  }
  return Math.max(
    CONTAINER_LIMIT_MIN,
    Math.min(CONTAINER_LIMIT_MAX, Math.floor(value)),
  );
}

export type ContainerStatus = "success" | "warning" | "danger" | "neutral";

// Problems first so the most actionable containers are visible without
// scrolling: running-but-unhealthy and restarting, then stopped, then healthy.
export function containerRank(item: DockerContainerItem): number {
  const variant = containerVariant(item);
  if (variant === "warning") return 0;
  if (variant === "danger") return 1;
  if (variant === "neutral") return 2;
  return 3;
}

export function containerVariant(item: DockerContainerItem): ContainerStatus {
  switch (item.state) {
    case "running":
      return item.healthy ? "success" : "warning";
    case "restarting":
      return "warning";
    case "paused":
    case "created":
      return "neutral";
    default:
      // exited, dead, removing, ...
      return "danger";
  }
}

export function sortContainers(
  items: DockerContainerItem[],
): DockerContainerItem[] {
  return [...items].sort((a, b) => {
    const rank = containerRank(a) - containerRank(b);
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name);
  });
}
