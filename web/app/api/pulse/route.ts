import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const [onlineUsers, activeGroups, recentTransaction] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.tontineGroup.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.findFirst({
      where: { status: "PAID" },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true } }, tontineGroup: { select: { name: true } } }
    })
  ]);

  const event = recentTransaction
    ? {
        id: `db_${recentTransaction.id}`,
        type: "payment",
        title: `${recentTransaction.user.fullName} a cotisé — ${recentTransaction.tontineGroup?.name ?? "Groupe"}`,
        region: "Live",
        currency: recentTransaction.currency,
        amount: recentTransaction.amountCents,
        generatedAt: recentTransaction.createdAt.toISOString()
      }
    : null;

  return NextResponse.json({
    mode: "polling-db",
    metrics: { onlineUsers, activeGroups, latencyMs: 0 },
    event
  });
}
