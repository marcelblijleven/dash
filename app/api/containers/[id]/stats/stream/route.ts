import type { NextRequest } from "next/server";
import { type LiveStatsData, subscribeToContainerStats } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const encoder = new TextEncoder();
  const id = (await params).id;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (stats: LiveStatsData) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(stats)}\n\n`),
          );
        } catch {
          // controller already closed
        }
      };

      const unsubscribe = subscribeToContainerStats(id, send);

      req.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // controller already closed
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
