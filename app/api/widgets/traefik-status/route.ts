import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth/current-user";
import { getTraefikStatus } from "@/lib/widgets/traefik-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await getTraefikStatus();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dash:traefik-status] fetch failed", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
