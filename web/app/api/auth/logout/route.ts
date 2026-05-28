import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookie, getSessionFromRequest } from "@/lib/auth";
import { auditLog, clientIp } from "@/lib/security";

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  if (session) {
    await auditLog({
      actorId: session.userId,
      action: "LOGOUT",
      targetType: "User",
      targetId: session.userId,
      ipAddress: clientIp(request)
    });
  }

  return response;
}
