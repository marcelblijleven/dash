import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/current-user";
import { TeslamatePostgresNotConfigured } from "@/lib/teslamate/postgres";
import { getLastLocation } from "@/lib/widgets/teslamate-location/query";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ carId: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { carId } = await params;
  const id = Number(carId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "invalid car id" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getLastLocation(id));
  } catch (e) {
    if (e instanceof TeslamatePostgresNotConfigured) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:teslamate-location] route failed", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
