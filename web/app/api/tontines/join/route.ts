import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { canJoinTontine, lockCollateral } from "@/lib/antiFraud";
import { getTrustScoreForOrdering } from "@/lib/antiFraud";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/realtime-server";
import { safeJson } from "@/lib/request";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { joinSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // Rate limit : 20 tentatives / 5 min — protège contre brute force sans bloquer l'usage légitime
  const limit = await rateLimit(request, "join-tontine", 20, 300_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 10 minutes." }, { status: 429 });

  const parsed = joinSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  // Vérifier que le compte utilisateur est actif (pas suspendu/banni)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { status: true, trustScore: true }
  });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Votre compte n'est pas autorisé à rejoindre des groupes." }, { status: 403 });
  }

  const group = await prisma.tontineGroup.findUnique({
    where: { joinCode: parsed.data.joinCode },
    select: { id: true, maxMembers: true, name: true, status: true, minTrustScore: true, collateralRounds: true, contributionCents: true, currency: true },
  } as never) as { id: string; maxMembers: number; name: string; status: string; minTrustScore: number; collateralRounds: number; contributionCents: number; currency: string } | null;

  if (!group || !["ACTIVE", "OPEN"].includes(group.status)) {
    return NextResponse.json({ error: "Code invalide ou groupe non disponible." }, { status: 404 });
  }

  // Anti-fraude : blacklist + trust score
  const canJoin = await canJoinTontine(session.userId, group.minTrustScore ?? 0);
  if (!canJoin.ok) return NextResponse.json({ error: canJoin.reason }, { status: 403 });

  const existingMembership = await prisma.membership.findFirst({
    where: { userId: session.userId, tontineGroupId: group.id }
  });
  if (existingMembership) return NextResponse.json({ groupId: group.id, alreadyMember: true });

  // Vérouiller collatéral si requis
  if (group.collateralRounds > 0) {
    const lockResult = await lockCollateral(session.userId, group.id, group.collateralRounds, group.contributionCents, group.currency);
    if (!lockResult.ok) return NextResponse.json({ error: lockResult.reason, collateralRequired: true }, { status: 402 });
  }

  // Ordre de payout basé sur le trust score (plus haute confiance = plus tôt)
  const trustForOrder = await getTrustScoreForOrdering(session.userId);

  try {
    await prisma.$transaction(async (tx) => {
      const memberCount = await tx.membership.count({
        where: { tontineGroupId: group.id, status: { notIn: ["LEFT", "EXCLUDED"] } },
      });
      if (memberCount >= group.maxMembers) throw new Error("FULL");
      const payoutOrder = memberCount + 1;
      await tx.membership.create({
        data: {
          userId: session.userId,
          tontineGroupId: group.id,
          payoutOrder,
          status: "ACTIVE",
        }
      });
      void trustForOrder; // utilisé pour futur réordonnancement auto
    });
  } catch (err) {
    if (err instanceof Error && err.message === "FULL") {
      return NextResponse.json({ error: "Ce groupe est complet." }, { status: 409 });
    }
    throw err;
  }

  revalidateTag("admin");

  await auditLog({
    actorId: session.userId,
    action: "TONTINE_JOINED",
    targetType: "TontineGroup",
    targetId: group.id,
    ipAddress: clientIp(request),
    metadata: { groupName: group.name, userTrustScore: user.trustScore?.score ?? 50 }
  });

  void emitEvent({
    type: "activity:new",
    title: `${session.fullName} a rejoint ${group.name}`,
    region: "Nouveau membre",
    currency: "XOF",
    amount: 0,
    room: `tontine:${group.id}`
  });

  return NextResponse.json({ groupId: group.id });
}
