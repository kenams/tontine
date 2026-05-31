import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { defaultCurrency } from "@/lib/currency";

async function _getUserDashboard(userId: string) {
  const [user, memberships, transactions, notifications] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        wallet: true,
        trustScore: true,
        badges: { include: { badge: true } }
      }
    }),
    prisma.membership.findMany({
      where: { userId },
      include: {
        tontineGroup: {
          include: {
            emergencyFund: true,
            memberships: true,
            contributions: true,
            messages: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 2 }
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { tontineGroup: true },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const walletCurrency = user.wallet?.currency ?? defaultCurrency;
  const totalSaved = transactions
    .filter((transaction) => transaction.status === "PAID" && transaction.currency === walletCurrency)
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
  const nextMembership = memberships
    .map((membership) => membership.tontineGroup)
    .sort((a, b) => a.nextDueAt.getTime() - b.nextDueAt.getTime())[0];

  return { user, memberships, transactions, notifications, totalSaved, nextMembership };
}

// Cache cross-request 15s par userId — évite les requêtes DB sur chaque navigation entre onglets
export const getUserDashboard = (userId: string) =>
  unstable_cache(_getUserDashboard, ["user-dashboard", userId], { revalidate: 15, tags: [`user-${userId}`] })(userId);

export async function getTontineDetail(groupId: string, userId?: string) {
  const group = await prisma.tontineGroup.findUniqueOrThrow({
    where: { id: groupId },
    include: {
      emergencyFund: true,
      memberships: {
        include: { user: { include: { trustScore: true, wallet: true } } },
        orderBy: { payoutOrder: "asc" }
      },
      contributions: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 20
      },
      transactions: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 20
      },
      messages: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
        take: 50
      },
      votes: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  const isMember = userId ? group.memberships.some((membership) => membership.userId === userId) : false;
  return { group, isMember };
}

async function _getUserTontines(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      tontineGroup: {
        include: {
          emergencyFund: true,
          memberships: true,
          contributions: true
        }
      }
    },
    orderBy: { joinedAt: "desc" }
  });
}

export const getUserTontines = (userId: string) =>
  unstable_cache(_getUserTontines, ["user-tontines", userId], { revalidate: 15, tags: [`user-${userId}`] })(userId);

export async function getAdminStats() {
  try {
  const [
    totalUsers,
    activeUsers,
    totalTontines,
    activeTontines,
    transactions,
    pendingTransactions,
    failedTransactions,
    lateMemberships,
    alerts,
    recentTransactions,
    users,
    groups,
    feesAllTime,
    feesThisMonth
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.tontineGroup.count(),
    prisma.tontineGroup.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.findMany({ take: 5000, orderBy: { createdAt: "desc" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { status: "FAILED" } }),
    prisma.membership.count({ where: { status: "LATE" } }),
    prisma.fraudAlert.findMany({ include: { user: true, tontineGroup: true }, orderBy: { createdAt: "desc" } }),
    prisma.transaction.findMany({
      include: { user: true, tontineGroup: true },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.user.findMany({ include: { wallet: true, trustScore: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.tontineGroup.findMany({ include: { memberships: true, contributions: true }, take: 8 }),
    prisma.transaction.aggregate({ where: { type: "PLATFORM_FEE", status: "PAID" }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({ where: { type: "PLATFORM_FEE", status: "PAID", createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { amountCents: true } })
  ]);

  const volumeByCurrency = Object.entries(
    transactions.reduce<Record<string, number>>((acc, transaction) => {
      acc[transaction.currency] = (acc[transaction.currency] ?? 0) + transaction.amountCents;
      return acc;
    }, {})
  )
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
  const paidByCurrency = Object.entries(
    transactions
      .filter((transaction) => transaction.status === "PAID")
      .reduce<Record<string, number>>((acc, transaction) => {
        acc[transaction.currency] = (acc[transaction.currency] ?? 0) + transaction.amountCents;
        return acc;
      }, {})
  )
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
  const primaryVolume = volumeByCurrency[0] ?? { currency: defaultCurrency, amount: 0 };
  const primaryPaid = paidByCurrency.find((item) => item.currency === primaryVolume.currency) ?? {
    currency: primaryVolume.currency,
    amount: 0
  };
  const platformRevenue = feesAllTime._sum.amountCents ?? 0;
  const platformRevenueThisMonth = feesThisMonth._sum.amountCents ?? 0;

  const chart = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => ({
    month,
    volume: Math.round((primaryPaid.amount / 6) * (0.7 + index * 0.12)),
    risk: Math.max(4, 28 - index * 3)
  }));

  return {
    totalUsers,
    activeUsers,
    totalTontines,
    activeTontines,
    totalVolume: primaryVolume.amount,
    totalVolumeCurrency: primaryVolume.currency,
    volumeByCurrency,
    platformRevenue,
    platformRevenueThisMonth,
    pendingTransactions,
    failedTransactions,
    lateMemberships,
    alerts,
    recentTransactions,
    users,
    groups,
    chart
  };
  } catch (e) {
    console.error("[getAdminStats] Erreur Prisma:", e);
    const empty = { currency: defaultCurrency, amount: 0 };
    return {
      totalUsers: 0, activeUsers: 0, totalTontines: 0, activeTontines: 0,
      totalVolume: 0, totalVolumeCurrency: defaultCurrency, volumeByCurrency: [],
      platformRevenue: 0, pendingTransactions: 0, failedTransactions: 0,
      lateMemberships: 0, alerts: [], recentTransactions: [], users: [], groups: [],
      chart: ["Jan","Feb","Mar","Apr","May","Jun"].map((month) => ({ month, volume: 0, risk: 0 }))
    };
  }
}

export const getCachedAdminStats = unstable_cache(
  getAdminStats,
  ["admin-stats"],
  { revalidate: 20, tags: ["admin"] }
);
