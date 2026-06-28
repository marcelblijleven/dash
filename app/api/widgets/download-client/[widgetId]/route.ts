import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/current-user";
import { loadConfig } from "@/lib/config/loader";
import { getDownloadSnapshot } from "@/lib/download/client";
import {
  type DownloadWidgetConfig,
  resolveDownloadConfig,
} from "@/lib/widgets/download-client";

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
    (w) => w.type === "download-client" && w.id === widgetId,
  ) as DownloadWidgetConfig | undefined;

  if (!widget) {
    return NextResponse.json({ error: "unknown widget" }, { status: 404 });
  }

  const resolved = resolveDownloadConfig(widget);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  try {
    const snapshot = await getDownloadSnapshot(resolved.connection);
    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[dash:download-client] ${widgetId} fetch failed`, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
