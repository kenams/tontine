import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/realtime-server";
import { penalizeLate } from "@/lib/trust";

const dueDays: Record<string, number> = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const overdueGroups = await prisma.tontineGroup.findMany({
    where: { status: "ACTIVE", nextDueAt: { lt: now } },
    include: { memberships: { orderBy: { payoutOrder: "asc" } } }
  });

  let advanced = 0;
  const results: string[] = [];

  for (const group of overdueGroups) {
    const days = dueDays[group.frequency] ?? 30;
    const nextDue = new Date(group.nextDueAt.getTime() + days * 24 * 60 * 60 * 1000);
    const nextRound = group.currentRound + 1;
    const totalMembers = group.memberships.length;
    const payoutMembership = group.memberships.find((m) => m.payoutOrder === group.currentRound % totalMembers + 1);

    await prisma.$transaction([
      prisma.tontineGroup.update({
        where: { id: group.id },
        data: {
          currentRound: nextRound,
          nextDueAt: nextDue,
          status: nextRound > totalMembers ? "COMPLETED" : "ACTIVE"
        }
      }),
      prisma.membership.updateMany({
        where: { tontineGroupId: group.id },
        data: { paidThisRound: false }
      }),
      ...(payoutMembership
        ? [
            prisma.notification.create({
              data: {
                userId: payoutMembership.userId,
                tontineGroupId: group.id,
                title: "C'est votre tour de recevoir !",
                body: `Le round ${group.currentRound} de ${group.name} vous désigne comme bénéficiaire.`,
                type: "PAYOUT"
              }
            })
          ]
        : [])
    ]);

    void emitEvent({
      type: "activity:new",
      title: `Nouveau round — ${group.name}`,
      region: `Round ${nextRound}`,
      currency: group.currency,
      amount: group.contributionCents,
      room: `tontine:${group.id}`
    });

    advanced++;
    results.push(`${group.name}: round ${group.currentRound} → ${nextRound}, due ${nextDue.toISOString().slice(0, 10)}`);
  }

  const lateMembers = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      paidThisRound: false,
      tontineGroup: { nextDueAt: { lt: now } }
    },
    select: { userId: true }
  });
  const lateUpdate = await prisma.membership.updateMany({
    where: {
      status: "ACTIVE",
      paidThisRound: false,
      tontineGroup: { nextDueAt: { lt: now } }
    },
    data: { status: "LATE" }
  });
  for (const { userId } of lateMembers) {
    void penalizeLate(userId);
  }

  return NextResponse.json({ ok: true, advanced, late: lateUpdate.count, groups: results });
}
