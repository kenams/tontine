import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { safeJson } from "@/lib/request";

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").trim();

const profileSchema = z.object({
  fullName: z.string().min(2).max(80).transform(stripHtml).refine((s) => s.length >= 2, "Nom invalide.").optional(),
  phone: z.string().min(6).max(24).optional().or(z.literal("")),
});

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const limit = await rateLimit(request, "profile-update", 5, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de modifications." }, { status: 429 });

  const parsed = profileSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const { fullName, phone } = parsed.data;
  if (!fullName && phone === undefined) return NextResponse.json({ error: "Aucun champ à modifier." }, { status: 400 });

  const data: Record<string, string> = {};
  if (fullName) data.fullName = fullName;
  if (phone !== undefined) data.phone = phone;

  const user = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { id: true, fullName: true, phone: true, email: true },
  });

  await auditLog({
    actorId: session.userId,
    action: "PROFILE_UPDATED",
    targetType: "User",
    targetId: session.userId,
    ipAddress: clientIp(request),
    metadata: { fields: Object.keys(data) },
  });

  return NextResponse.json({ ok: true, user });
}
