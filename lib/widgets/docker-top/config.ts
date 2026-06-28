import type { DockerTopItem } from "./docker-top-live";

export const DEFAULT_TOP_LIMIT = 5;
const TOP_LIMIT_MIN = 1;
const TOP_LIMIT_MAX = 50;

export type SortBy = "cpu" | "memory";

export function clampLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_TOP_LIMIT;
  }
  return Math.max(TOP_LIMIT_MIN, Math.min(TOP_LIMIT_MAX, Math.floor(value)));
}

export function resolveSort(value: unknown): SortBy {
  return value === "memory" ? "memory" : "cpu";
}

export function sortByMetric(
  items: DockerTopItem[],
  sort: SortBy,
): DockerTopItem[] {
  return [...items].sort((a, b) => {
    const diff = sort === "memory" ? b.memUsed - a.memUsed : b.cpu - a.cpu;
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}
