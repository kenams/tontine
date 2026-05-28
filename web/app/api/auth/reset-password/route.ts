import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { safeJson } from "@/lib/request";
import { rateLimit } from "@/lib/security";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
});

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, "reset-password", 5, 300_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  const parsed = schema.safeParse(await safeJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Token ou mot de passe invalide." }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Lien expiré ou déjà utilisé." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) }
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    })
  ]);

  return NextResponse.json({ ok: true });
}
