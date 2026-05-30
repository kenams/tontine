import { type NextRequest, NextResponse } from "next/server";

import { sessionCookieName, verifySessionToken } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // Si le cookie de session est déjà là, rien à faire
  if (request.cookies.get(sessionCookieName)) return NextResponse.next();

  // Extraire Bearer token du header Authorization (clients mobiles)
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.next();

  const token = auth.slice(7).trim();
  const session = verifySessionToken(token);
  if (!session) return NextResponse.next();

  // Injecter le token comme cookie dans les headers de la requête
  // pour que getSession() → cookies() puisse le lire
  const existingCookie = request.headers.get("cookie") ?? "";
  const cookieHeader = existingCookie
    ? `${existingCookie}; ${sessionCookieName}=${token}`
    : `${sessionCookieName}=${token}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("cookie", cookieHeader);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/api/:path*"],
};
