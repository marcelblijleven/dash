import type { Service } from "./types";

const HOST_RE = /Host\(`([^`]+)`\)/g;

export function extractHosts(rule: string): string[] {
  const hosts: string[] = [];
  while (true) {
    const m = HOST_RE.exec(rule);
    if (m === null) break;
    hosts.push(m[1]);
  }
  return hosts;
}

export function serviceHealthy(s: Service): boolean | null {
  if (!s.serverStatus) return null;
  const statuses = Object.values(s.serverStatus);
  if (statuses.length === 0) return null;
  return statuses.every((v) => v === "UP");
}

// buildServiceMap builds a map that removes the provider suffix that
// traefik sometimes adds. E.g. sonarr@docker and sonarr
export function buildServiceMap(services: Service[]): Map<string, Service> {
  const map = new Map<string, Service>();
  for (const s of services) {
    map.set(s.name, s);
    const at = s.name.indexOf("@");
    if (at > 0) {
      const base = s.name.slice(0, at);
      if (!map.has(base)) map.set(base, s);
    }
  }
  return map;
}
