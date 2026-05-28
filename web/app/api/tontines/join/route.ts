import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { joinSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const limit = await rateLimit(request, "join-tontine", 12, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives de code." }, { status: 429 });

  const parsed = joinSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  const group = await prisma.tontineGroup.findUnique({
    where: { joinCode: parsed.data.joinCode },
    select: { id: true, maxMembers: true, name: true }
  });
  if (!group) return NextResponse.json({ error: "Aucune tontine ne correspond à ce code." }, { status: 404 });

  const existingMembership = await prisma.membership.findFirst({
    where: { userId: session.userId, tontineGroupId: group.id }
  });
  if (existingMembership) return NextResponse.json({ groupId: group.id, alreadyMember: true });

  try {
    await prisma.$transaction(async (tx) => {
      const memberCount = await tx.membership.count({ where: { tontineGroupId: group.id } });
      if (memberCount >= group.maxMembers) {
        throw new Error("FULL");
      }
      await tx.membership.create({
        data: {
          userId: session.userId,
          tontineGroupId: group.id,
          payoutOrder: memberCount + 1,
          status: "ACTIVE"
        }
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "FULL") {
      return NextResponse.json({ error: "Ce groupe est complet." }, { status: 409 });
    }
    throw err;
  }

  await auditLog({
    actorId: session.userId,
    action: "TONTINE_JOINED",
    targetType: "TontineGroup",
    targetId: group.id,
    ipAddress: clientIp(request)
  });

  return NextResponse.json({ groupId: group.id });
}
