import { describe, expect, it } from "vitest";
import type { DockerContainerItem } from "./docker-containers-live";
import {
  clampLimit,
  containerVariant,
  DEFAULT_CONTAINER_LIMIT,
  sortContainers,
} from "./config";

function item(partial: Partial<DockerContainerItem>): DockerContainerItem {
  return {
    id: "abc",
    name: "container",
    state: "running",
    status: "Up 2 hours",
    healthy: true,
    ...partial,
  };
}

describe("clampLimit", () => {
  it("returns the default for non-numeric input", () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_CONTAINER_LIMIT);
    expect(clampLimit("8")).toBe(DEFAULT_CONTAINER_LIMIT);
    expect(clampLimit(Number.NaN)).toBe(DEFAULT_CONTAINER_LIMIT);
  });

  it("clamps to the 1..50 range and floors fractions", () => {
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(99)).toBe(50);
    expect(clampLimit(5.9)).toBe(5);
  });
});

describe("containerVariant", () => {
  it("marks running healthy containers as success", () => {
    expect(containerVariant(item({ state: "running", healthy: true }))).toBe(
      "success",
    );
  });

  it("marks running unhealthy and restarting containers as warning", () => {
    expect(containerVariant(item({ state: "running", healthy: false }))).toBe(
      "warning",
    );
    expect(containerVariant(item({ state: "restarting" }))).toBe("warning");
  });

  it("marks paused and created containers as neutral", () => {
    expect(containerVariant(item({ state: "paused" }))).toBe("neutral");
    expect(containerVariant(item({ state: "created" }))).toBe("neutral");
  });

  it("marks exited and dead containers as danger", () => {
    expect(containerVariant(item({ state: "exited" }))).toBe("danger");
    expect(containerVariant(item({ state: "dead" }))).toBe("danger");
  });
});

describe("sortContainers", () => {
  it("orders problems first, then by name", () => {
    const items = [
      item({ name: "healthy-b", state: "running", healthy: true }),
      item({ name: "stopped", state: "exited" }),
      item({ name: "unhealthy", state: "running", healthy: false }),
      item({ name: "healthy-a", state: "running", healthy: true }),
      item({ name: "paused", state: "paused" }),
    ];
    expect(sortContainers(items).map((i) => i.name)).toEqual([
      "unhealthy",
      "stopped",
      "paused",
      "healthy-a",
      "healthy-b",
    ]);
  });

  it("does not mutate the input array", () => {
    const items = [item({ name: "b" }), item({ name: "a" })];
    sortContainers(items);
    expect(items.map((i) => i.name)).toEqual(["b", "a"]);
  });
});
