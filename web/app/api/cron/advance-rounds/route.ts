import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

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

    advanced++;
    results.push(`${group.name}: round ${group.currentRound} → ${nextRound}, due ${nextDue.toISOString().slice(0, 10)}`);
  }

  const lateUpdate = await prisma.membership.updateMany({
    where: {
      status: "ACTIVE",
      paidThisRound: false,
      tontineGroup: { nextDueAt: { lt: now } }
    },
    data: { status: "LATE" }
  });

  return NextResponse.json({ ok: true, advanced, late: lateUpdate.count, groups: results });
}
