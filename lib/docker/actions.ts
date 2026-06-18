import { proxyUrl } from "./utils";

export type ContainerAction = "start" | "stop" | "restart";

// Mutates container state. Requires POST=1 + CONTAINERS=1 on socket-proxy.
// Returns 204 (success) or 304 (already in target state). Anything else throws.
export async function dockerAction(
  id: string,
  action: ContainerAction,
): Promise<void> {
  const base = await proxyUrl();
  const res = await fetch(`${base}/containers/${id}/${action}`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (res.status !== 204 && res.status !== 304) {
    if (res.status === 403) {
      throw new Error(
        `socket proxy denied ${action}. Enable POST=1 (and verify the action endpoint isn't blocked).`,
      );
    }
    throw new Error(`docker ${action} ${id}: ${res.status} ${res.statusText}`);
  }
}
