import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const [onlineUsers, activeGroups, recentTransaction] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.tontineGroup.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.findFirst({
      where: { status: "PAID" },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true } }, tontineGroup: { select: { name: true } } },
    })
  ]);

  function anonymize(name: string) {
    const parts = name.trim().split(" ");
    return parts.map((p, i) => (i === 0 ? p[0] + "***" : p[0] + ".")).join(" ");
  }

  const event = recentTransaction
    ? {
        id: `db_${recentTransaction.id}`,
        type: "payment",
        title: `${anonymize(recentTransaction.user.fullName)} a cotisé — ${recentTransaction.tontineGroup?.name ?? "Groupe"}`,
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
