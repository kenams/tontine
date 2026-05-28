import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { rateLimit, clientIp } from "@/lib/security";
import { z } from "zod";

const schema = z.object({ email: z.string().email().transform((v) => v.toLowerCase()) });

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, "forgot-password", 10, 300_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 5 minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await safeJson(request));
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });
    await sendPasswordResetEmail(user.email, token);
  }

  return NextResponse.json({ ok: true });
}
