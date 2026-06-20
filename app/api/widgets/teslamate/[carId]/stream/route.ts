import { type NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/current-user";
import {
  getTeslaState,
  subscribeTeslaState,
  TeslamateMqttNotConfigured,
  type TeslaState,
} from "@/lib/teslamate/mqtt";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ carId: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { carId } = await params;
  const encoder = new TextEncoder();

  try {
    const initial = await getTeslaState(carId);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (state: TeslaState) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(state)}\n\n`),
            );
          } catch {
            // controller already closed
          }
        };

        if (initial) send(initial);

        const unsubscribe = await subscribeTeslaState(carId, send);

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
  } catch (e) {
    if (e instanceof TeslamateMqttNotConfigured) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-stream] failed", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
