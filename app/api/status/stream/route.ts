import type { NextRequest } from "next/server";
import { getStatusSnapshot } from "@/lib/status";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 5000;

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let cancelled = false;

      const send = async () => {
        if (cancelled) return;
        try {
          const snapshot = await getStatusSnapshot();
          if (cancelled) return;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`),
          );
        } catch {
          // transient docker/traefik errors are swallowed; the next tick retries
        }
      };

      await send();
      const id = setInterval(send, POLL_INTERVAL_MS);

      req.signal.addEventListener("abort", () => {
        cancelled = true;
        clearInterval(id);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
