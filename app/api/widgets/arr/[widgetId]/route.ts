import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/current-user";
import { getArrSnapshot } from "@/lib/arr/client";
import { loadConfig } from "@/lib/config/loader";
import {
  type ArrWidgetConfig,
  resolveArrConfig,
} from "@/lib/widgets/arr/config";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ widgetId: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { widgetId } = await params;
  const { config } = await loadConfig();

  const widget = config.widgets.find(
    (w) => w.type === "arr" && w.id === widgetId,
  ) as ArrWidgetConfig | undefined;

  if (!widget) {
    return NextResponse.json({ error: "unknown widget" }, { status: 404 });
  }

  const resolved = resolveArrConfig(widget);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  try {
    const snapshot = await getArrSnapshot(resolved.connection);
    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[dash:arr] ${widgetId} fetch failed`, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
