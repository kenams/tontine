import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { joinSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const limit = rateLimit(request, "join-tontine", 12, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives de code." }, { status: 429 });

  const parsed = joinSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  const group = await prisma.tontineGroup.findUnique({
    where: { joinCode: parsed.data.joinCode },
    include: { memberships: true }
  });
  if (!group) return NextResponse.json({ error: "Aucune tontine ne correspond a ce code." }, { status: 404 });
  if (group.memberships.some((membership) => membership.userId === session.userId)) {
    return NextResponse.json({ groupId: group.id, alreadyMember: true });
  }
  if (group.memberships.length >= group.maxMembers) {
    return NextResponse.json({ error: "Ce groupe est complet." }, { status: 409 });
  }

  await prisma.membership.create({
    data: {
      userId: session.userId,
      tontineGroupId: group.id,
      payoutOrder: group.memberships.length + 1,
      status: "ACTIVE"
    }
  });

  await auditLog({
    actorId: session.userId,
    action: "TONTINE_JOINED",
    targetType: "TontineGroup",
    targetId: group.id,
    ipAddress: clientIp(request)
  });

  return NextResponse.json({ groupId: group.id });
}
