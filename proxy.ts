import { type NextRequest, NextResponse } from "next/server";

const SENSITIVE_HEADERS = [
  "x-authentik-username",
  "x-authentik-email",
  "x-authentik-name",
  "x-authentik-groups",
  "x-authentik-uid",
];

type AuthMode = "none" | "forward_auth";
const AUTH_MODE: AuthMode = (process.env.DASH_AUTH_MODE ||
  "forward_auth") as AuthMode;
const PROXY_SECRET = process.env.DASH_PROXY_SECRET;
const PROXY_SECRET_HEADER = "x-dash-proxy-secret";

export function proxy(request: NextRequest) {
  if (AUTH_MODE === "none") {
    return NextResponse.next();
  }

  // forward_auth mode: enforce trust boundary
  const secret = request.headers.get(PROXY_SECRET_HEADER);
  const trusted = !!PROXY_SECRET && secret === PROXY_SECRET;

  const headers = new Headers(request.headers);
  headers.delete(PROXY_SECRET_HEADER);

  if (!trusted) {
    // Make sure someone can't impersonate by providing a known authentik header
    for (const header of SENSITIVE_HEADERS) headers.delete(header);
  }

  return NextResponse.next({ headers: headers });
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
