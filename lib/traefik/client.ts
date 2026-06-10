import { loadConfig } from "@/lib/config/loader";
import type { Router, Service } from "./types";

async function apiUrl(): Promise<string> {
  const { config } = await loadConfig();
  return config.traefik.api_url;
}

async function get<T>(path: string): Promise<T> {
  const base = await apiUrl();
  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`traefik ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function listRouters() {
  return get<Router[]>("/api/http/routers");
}

export function listServices() {
  return get<Service[]>("/api/http/services");
}
