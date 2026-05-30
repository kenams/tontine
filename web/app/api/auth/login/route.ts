import { NextResponse, type NextRequest } from "next/server";

import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { redirectUrl, safeJson } from "@/lib/request";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, "login", 8, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Trop de tentatives. Reessayez dans une minute." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isFormPost = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const body = isFormPost ? Object.fromEntries(await request.formData()) : await safeJson(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return isFormPost
      ? NextResponse.redirect(redirectUrl(request, "/login?error=invalid"), { status: 303 })
      : NextResponse.json({ error: "Identifiants invalides." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return isFormPost
      ? NextResponse.redirect(redirectUrl(request, "/login?error=credentials"), { status: 303 })
      : NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
  }
  if (user.status === "BANNED" || user.status === "SUSPENDED") {
    return isFormPost
      ? NextResponse.redirect(redirectUrl(request, "/login?error=restricted"), { status: 303 })
      : NextResponse.json({ error: "Compte restreint. Contactez le support." }, { status: 403 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    status: user.status
  });

  const redirectTo = user.role === "ADMIN" ? "/admin" : "/dashboard";
  const isMobile = request.headers.get("x-client-type") === "mobile" || request.headers.get("x-platform") === "mobile";
  const response = isFormPost
    ? NextResponse.redirect(redirectUrl(request, redirectTo), { status: 303 })
    : NextResponse.json({
        ok: true,
        role: user.role,
        redirectTo,
        // Inclus pour les clients mobiles (Bearer token)
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone ?? null }
      });
  setSessionCookie(response, token);

  await auditLog({
    actorId: user.id,
    action: user.role === "ADMIN" ? "ADMIN_LOGIN" : "USER_LOGIN",
    targetType: "User",
    targetId: user.id,
    ipAddress: clientIp(request)
  });

  return response;
}
