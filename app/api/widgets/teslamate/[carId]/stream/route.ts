import { type NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/current-user";
import { loadConfig } from "@/lib/config/loader";
import {
  resolveTeslamateConfig,
  type TeslamateWidgetConfig,
} from "@/lib/widgets/teslamate/config";
import {
  getTeslaState,
  subscribeTeslaState,
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
  const { config } = await loadConfig();

  const widget = config.widgets.find(
    (w) =>
      w.type === "teslamate" &&
      String((w as TeslamateWidgetConfig).car_id ?? "1") === carId,
  ) as TeslamateWidgetConfig | undefined;

  if (!widget) {
    return NextResponse.json({ error: "unknown car" }, { status: 404 });
  }

  const resolved = resolveTeslamateConfig(widget);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const encoder = new TextEncoder();

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

      const initial = await getTeslaState(resolved.connection, resolved.carId);
      if (initial) send(initial);

      const unsubscribe = await subscribeTeslaState(
        resolved.connection,
        resolved.carId,
        send,
      );

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
