import { NextResponse } from "next/server";
import { configJsonSchema } from "@/lib/config";

export async function GET() {
  return NextResponse.json(configJsonSchema(), {
    headers: {
      // Allow cross origin, for example for language servers in Neovim
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=300",
    },
  });
}
