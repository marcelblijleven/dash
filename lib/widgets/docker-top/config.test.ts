import { describe, expect, it } from "vitest";
import {
  clampLimit,
  DEFAULT_TOP_LIMIT,
  resolveSort,
  sortByMetric,
} from "./config";
import type { DockerTopItem } from "./docker-top-live";

function item(partial: Partial<DockerTopItem>): DockerTopItem {
  return {
    id: "abc",
    name: "container",
    cpu: 0,
    memUsed: 0,
    memLimit: 1024,
    memPct: 0,
    ...partial,
  };
}

describe("clampLimit", () => {
  it("returns the default for non-numeric input", () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_TOP_LIMIT);
    expect(clampLimit("5")).toBe(DEFAULT_TOP_LIMIT);
    expect(clampLimit(Number.NaN)).toBe(DEFAULT_TOP_LIMIT);
  });

  it("clamps to the 1..50 range and floors fractions", () => {
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(99)).toBe(50);
    expect(clampLimit(5.9)).toBe(5);
  });
});

describe("resolveSort", () => {
  it("defaults to cpu for anything but memory", () => {
    expect(resolveSort(undefined)).toBe("cpu");
    expect(resolveSort("cpu")).toBe("cpu");
    expect(resolveSort("nonsense")).toBe("cpu");
  });

  it("returns memory when requested", () => {
    expect(resolveSort("memory")).toBe("memory");
  });
});

describe("sortByMetric", () => {
  it("orders by cpu descending, then name", () => {
    const items = [
      item({ name: "low", cpu: 1 }),
      item({ name: "high", cpu: 90 }),
      item({ name: "mid-b", cpu: 50 }),
      item({ name: "mid-a", cpu: 50 }),
    ];
    expect(sortByMetric(items, "cpu").map((i) => i.name)).toEqual([
      "high",
      "mid-a",
      "mid-b",
      "low",
    ]);
  });

  it("orders by memory usage descending when sorting by memory", () => {
    const items = [
      item({ name: "small", memUsed: 100, cpu: 99 }),
      item({ name: "big", memUsed: 9000, cpu: 1 }),
    ];
    expect(sortByMetric(items, "memory").map((i) => i.name)).toEqual([
      "big",
      "small",
    ]);
  });

  it("does not mutate the input array", () => {
    const items = [item({ name: "b", cpu: 1 }), item({ name: "a", cpu: 2 })];
    sortByMetric(items, "cpu");
    expect(items.map((i) => i.name)).toEqual(["b", "a"]);
  });
});
