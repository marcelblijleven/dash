import type { z } from "zod";
import type { ConfigSchema } from "@/lib/config/schema";
import { type Container, containerName, isHealthy } from "@/lib/docker";
import { extractHosts, type Router } from "@/lib/traefik";
import { isEnabled, pick, SHORTCUT, shouldHide } from "./labels";

export type ParseOptions = {
  autoDiscover?: boolean;
};

export type Shortcut = {
  name: string;
  path: string;
  icon?: string;
};

export type DashEntry = {
  id: string;
  name: string;
  containerName: string;
  category: string;
  description?: string;
  icon?: string;
  externalUrl?: string;
  localUrl?: string;
  running: boolean;
  healthy: boolean;
  shortcuts: Shortcut[];
};

/**
 * Attempts to get router names from labels
 **/
function declaredRouterNames(labels: Record<string, string>): string[] {
  const names = new Set<string>();
  for (const k of Object.keys(labels)) {
    const m = k.match(/^traefik\.http\.routers\.([^.]+)\./);
    if (m) names.add(m[1]);
  }
  return [...names];
}

/**
 * First checks the router rule for Traefik, as a fallback
 * looks for the Host(..) value on the container labels.
 **/
function resolveHostFor(
  labels: Record<string, string>,
  routersByName: Map<string, Router>,
): string | undefined {
  for (const name of declaredRouterNames(labels)) {
    const router = routersByName.get(name);
    if (router?.status !== "enabled") continue;

    const hosts = extractHosts(router.rule);
    if (hosts.length > 0) return hosts[0];
  }
  // Fallback: parse Host(...) directly off the container labels, in case
  // Traefik isn't reachable or the router was declared on the file provider.
  for (const [k, v] of Object.entries(labels)) {
    if (k.startsWith("traefik.http.routers.") && k.endsWith(".rule")) {
      const hosts = extractHosts(v);
      if (hosts.length > 0) return hosts[0];
    }
  }
  return undefined;
}

/**
 * Parse shortcuts from labels
 **/
function parseShortcuts(labels: Record<string, string>): Shortcut[] {
  const buckets = new Map<string, Partial<Shortcut>>();
  for (const [key, value] of Object.entries(labels)) {
    if (!key.startsWith(SHORTCUT)) continue;

    const rest = key.slice(SHORTCUT.length);
    const dot = rest.indexOf(".");
    if (dot < 0) continue;

    const idx = rest.slice(0, dot);
    const field = rest.slice(dot + 1);
    const bucket = buckets.get(idx) ?? {};

    if (field === "name") bucket.name = value;
    else if (field === "path") bucket.path = value;
    else if (field === "icon") bucket.icon = value;
    buckets.set(idx, bucket);
  }
  const out: Shortcut[] = [];
  for (const [, _bucket] of [...buckets.entries()].sort(([a], [c]) =>
    a.localeCompare(c),
  )) {
    if (_bucket.name && _bucket.path)
      out.push({
        name: _bucket.name,
        path: _bucket.path,
        icon: _bucket.icon,
      });
  }
  return out;
}

/**
 * Parse dash entries from containers and traefik routers.
 **/
export function parseDashEntries(
  containers: Container[],
  routers: Router[],
  opts: ParseOptions = {},
) {
  const autoDiscover = opts.autoDiscover ?? true;

  const routersByName = new Map<string, Router>();
  for (const router of routers) {
    // Remove any provider suffix from the name
    const base = router.name.replace(/@[^@]+$/, "");
    if (!routersByName.has(base)) {
      routersByName.set(base, router);
    }
  }

  const entries: DashEntry[] = [];

  for (const container of containers) {
    const labels = container.Labels ?? {};
    if (shouldHide(labels)) {
      continue;
    }

    const enabled = isEnabled(labels);
    const resolvedHost = resolveHostFor(labels, routersByName);
    const externalUrl =
      pick(labels, "url") ??
      (resolvedHost ? `https://${resolvedHost}` : undefined);

    if (enabled !== true) {
      if (!autoDiscover) continue;
      if (!externalUrl) continue;
    }

    const name = containerName(container);
    entries.push({
      id: container.Id,
      name: pick(labels, "title") ?? name,
      containerName: name,
      category: pick(labels, "category") ?? "uncategorized",
      description: pick(labels, "description"),
      icon: pick(labels, "icon"),
      externalUrl,
      localUrl: pick(labels, "local-url"),
      running: container.State === "running",
      healthy: isHealthy(container),
      shortcuts: parseShortcuts(labels),
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create entries from 'apps' in the config
 **/
export type ConfigApp = z.infer<typeof ConfigSchema>["apps"][number];

export function configAppsToEntries(apps: ConfigApp[]): DashEntry[] {
  return apps.map((app, idx) => ({
    id: `config:${idx}:${app.title}`,
    name: app.title,
    containerName: app.title,
    category: app.category ?? "uncategorized",
    description: app.description,
    icon: app.icon,
    externalUrl: app.url,
    localUrl: app["local-url"],
    running: true,
    healthy: true,
    shortcuts: app.shortcuts ?? [],
  }));
}
