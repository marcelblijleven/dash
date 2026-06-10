import { loadConfig } from "@/lib/config/loader";

export async function proxyUrl(): Promise<string> {
  const { config } = await loadConfig();
  return config.docker.proxy_url;
}
