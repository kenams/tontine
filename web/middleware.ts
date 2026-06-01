import { type NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "tontine_session";

// Edge-compatible token check — just validates structure & expiry
// Full HMAC verification happens in getSession() (Node.js routes)
function isTokenFormatValid(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as { exp?: number };
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // Cookie déjà présent → rien à faire
  if (request.cookies.get(COOKIE_NAME)) return NextResponse.next();

  // Bearer token (clients mobiles) → injecter comme cookie
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.next();

  const token = auth.slice(7).trim();
  if (!isTokenFormatValid(token)) return NextResponse.next();

  const existingCookie = request.headers.get("cookie") ?? "";
  const cookieHeader = existingCookie
    ? `${existingCookie}; ${COOKIE_NAME}=${token}`
    : `${COOKIE_NAME}=${token}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("cookie", cookieHeader);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/api/:path*"],
};
