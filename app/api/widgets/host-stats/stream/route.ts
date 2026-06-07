import type { NextRequest } from "next/server";
import {
  getLatestHostSnapshot,
  type HostSnapshot,
  subscribeHostSnapshot,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (snapshot: HostSnapshot) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`),
          );
        } catch {
          // controller already closed
        }
      };

      const initial = getLatestHostSnapshot();
      if (initial) send(initial);

      const unsubscribe = subscribeHostSnapshot(send);

      req.signal.addEventListener("abort", () => {
        unsubscribe();
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
