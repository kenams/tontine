import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86_400_000);
  const d60 = new Date(now.getTime() - 60 * 86_400_000);
  const d7  = new Date(now.getTime() - 7 * 86_400_000);

  const [
    totalUsers, newUsersLast30, newUsersD30to60,
    activeUsersLast30, activeUsersD30to60,
    totalVolume, volumeLast30, volumeD30to60,
    totalGroups, activeGroups,
    defaultedMembers, totalMembers,
    premiumUsers, revenueAllTime, revenueLast30,
    referrals
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: d30 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: d60, lt: d30 } } }),
    prisma.transaction.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({ where: { status: "PAID", createdAt: { gte: d30 } }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({ where: { status: "PAID", createdAt: { gte: d60, lt: d30 } }, _sum: { amountCents: true } }),
    prisma.tontineGroup.count(),
    prisma.tontineGroup.count({ where: { status: "ACTIVE" } }),
    prisma.membership.count({ where: { status: "EXCLUDED" } }),
    prisma.membership.count({ where: { status: { not: "LEFT" } } }),
    prisma.user.count({ where: { plan: "PREMIUM" } as never }),
    prisma.transaction.aggregate({ where: { type: "PLATFORM_FEE", status: "PAID" }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({ where: { type: "PLATFORM_FEE", status: "PAID", createdAt: { gte: d30 } }, _sum: { amountCents: true } }),
    (prisma.referral as never).count(),
  ]);

  const pct = (a: number, b: number) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);

  // Rétention 7j : users qui se sont connectés dans les 7 derniers jours parmi ceux créés il y a 30j+
  const retentionBase = await prisma.user.count({ where: { createdAt: { lt: d7 } } });
  const retentionActive = await prisma.user.count({ where: { createdAt: { lt: d7 }, lastLoginAt: { gte: d7 } } });
  const retentionRate = retentionBase > 0 ? Math.round((retentionActive / retentionBase) * 100) : 0;

  // Taux de défaut
  const defaultRate = totalMembers > 0 ? Math.round((defaultedMembers / totalMembers) * 100 * 10) / 10 : 0;

  // Revenus par device : PLATFORM_FEE + REFERRAL_REWARD (coût)
  const refRewardCost = await prisma.transaction.aggregate({ where: { type: "REFERRAL_REWARD", status: "PAID" }, _sum: { amountCents: true } });

  // Montant moyen par tontine
  const avgContrib = await prisma.tontineGroup.aggregate({ _avg: { contributionCents: true } });

  // Evolution mensuelle (6 derniers mois)
  const months: { month: string; users: number; volume: number; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [u, v, r] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.transaction.aggregate({ where: { status: "PAID", createdAt: { gte: start, lt: end } }, _sum: { amountCents: true } }),
      prisma.transaction.aggregate({ where: { type: "PLATFORM_FEE", status: "PAID", createdAt: { gte: start, lt: end } }, _sum: { amountCents: true } }),
    ]);
    months.push({
      month: start.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      users: u,
      volume: Math.round((v._sum.amountCents ?? 0) / 100),
      revenue: Math.round((r._sum.amountCents ?? 0) / 100),
    });
  }

  return NextResponse.json({
    // Utilisateurs
    totalUsers,
    newUsersLast30,
    userGrowthPct: pct(newUsersLast30, newUsersD30to60),
    activeUsersLast30,
    activeGrowthPct: pct(activeUsersLast30, activeUsersD30to60),
    retentionRate,
    premiumUsers,
    premiumRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,

    // Volume & revenus
    totalVolumeCents: totalVolume._sum.amountCents ?? 0,
    volumeLast30Cents: volumeLast30._sum.amountCents ?? 0,
    volumeGrowthPct: pct(volumeLast30._sum.amountCents ?? 0, volumeD30to60._sum.amountCents ?? 0),
    revenueAllTimeCents: revenueAllTime._sum.amountCents ?? 0,
    revenueLast30Cents: revenueLast30._sum.amountCents ?? 0,
    referralRewardCostCents: refRewardCost._sum.amountCents ?? 0,

    // Tontines
    totalGroups, activeGroups,
    avgContribCents: Math.round(avgContrib._avg.contributionCents ?? 0),

    // Santé
    defaultRate,
    defaultedMembers, totalMembers,

    // Parrainage
    totalReferrals: referrals,

    // Evolution
    monthlyChart: months,

    // KPIs investisseur
    kpis: {
      ltv: totalUsers > 0 ? Math.round(((revenueAllTime._sum.amountCents ?? 0) / totalUsers) / 100) : 0,
      arpu: activeUsersLast30 > 0 ? Math.round(((revenueLast30._sum.amountCents ?? 0) / activeUsersLast30) / 100 * 12) : 0,
      churnProxy: 100 - retentionRate,
    },

    generatedAt: now.toISOString(),
  });
}
