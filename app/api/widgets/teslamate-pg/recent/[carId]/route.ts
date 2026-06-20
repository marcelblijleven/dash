import { type NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/current-user";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import {
  getRecent,
  type RecentMode,
} from "@/lib/widgets/teslamate-recent/query";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ carId: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { carId } = await params;
  const id = Number(carId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "invalid car id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const mode: RecentMode =
    url.searchParams.get("mode") === "charges" ? "charges" : "drives";
  const limitParam = Number(url.searchParams.get("limit"));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(20, limitParam)
      : 3;

  try {
    const items = await getRecent(id, mode, limit);
    return NextResponse.json(items);
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-recent] route failed", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
