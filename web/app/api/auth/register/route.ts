import { NextResponse, type NextRequest } from "next/server";

import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { redirectUrl, safeJson } from "@/lib/request";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, "register", 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Trop de comptes crees depuis cette IP." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isFormPost = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const body = isFormPost ? Object.fromEntries(await request.formData()) : await safeJson(request);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return isFormPost
      ? NextResponse.redirect(redirectUrl(request, "/register?error=invalid"), { status: 303 })
      : NextResponse.json({ error: "Formulaire incomplet ou mot de passe trop faible." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return isFormPost
      ? NextResponse.redirect(redirectUrl(request, "/register?error=exists"), { status: 303 })
      : NextResponse.json({ error: "Un compte existe deja avec cet email." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      wallet: { create: { balanceCents: 0, currency: parsed.data.currency } },
      trustScore: { create: { score: 0, paymentReliability: 0, communityRating: 0, fraudRisk: 100 } },
      notifications: {
        create: {
          title: "Bienvenue sur Kotizy 🎉",
          body: "Votre compte est prêt. Créez ou rejoignez une tontine pour commencer à cotiser.",
          type: "WELCOME"
        }
      }
    }
  });

  await auditLog({
    actorId: user.id,
    action: "USER_REGISTERED",
    targetType: "User",
    targetId: user.id,
    ipAddress: clientIp(request)
  });

  void sendWelcomeEmail(user.email, user.fullName);

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: "USER",
    status: user.status
  });
  const response = isFormPost
    ? NextResponse.redirect(redirectUrl(request, "/onboarding"), { status: 303 })
    : NextResponse.json({
        ok: true,
        redirectTo: "/onboarding",
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName, role: "USER", phone: null }
      });
  setSessionCookie(response, token);
  return response;
}
