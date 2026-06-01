import "server-only";
import { prisma } from "@/lib/db";

// Vérifie si un user est blacklisté (a une dette non remboursée après exclusion)
export async function isBlacklisted(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  return user?.status === "BLACKLISTED";
}

// Blackliste un user exclu avec dette
export async function blacklistIfDebt(userId: string): Promise<void> {
  const memberships = await prisma.membership.findMany({
    where: { userId, status: "EXCLUDED" },
    select: { debtCents: true },
  } as never) as { debtCents: number }[];
  const totalDebt = memberships.reduce((sum, m) => sum + (m.debtCents ?? 0), 0);
  if (totalDebt > 0) {
    await prisma.user.update({ where: { id: userId }, data: { status: "BLACKLISTED" } });
    await prisma.notification.create({
      data: {
        userId,
        title: "⛔ Compte restreint",
        body: `Vous avez une dette non remboursée. Remboursez pour réactiver votre compte et rejoindre de nouvelles tontines.`,
        type: "BLACKLIST",
      },
    });
  }
}

// Calcule le score de confiance pondéré pour le payout ordering
export async function getTrustScoreForOrdering(userId: string): Promise<number> {
  const ts = await prisma.trustScore.findUnique({ where: { userId } });
  if (!ts) return 0;
  const daysSinceCreation = (Date.now() - (await prisma.user.findUnique({
    where: { id: userId }, select: { createdAt: true }
  }))!.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const seniority = Math.min(daysSinceCreation / 30, 10); // max 10 pts pour 10 mois
  return ts.score + seniority * 2;
}

// Vérifie si le user peut rejoindre une tontine (minTrustScore + blacklist)
export async function canJoinTontine(userId: string, minTrustScore: number): Promise<{ ok: boolean; reason?: string }> {
  if (await isBlacklisted(userId)) {
    return { ok: false, reason: "Votre compte est restreint suite à une dette impayée. Remboursez pour réactiver." };
  }
  const ts = await prisma.trustScore.findUnique({ where: { userId } });
  const score = ts?.score ?? 0;
  if (score < minTrustScore) {
    return { ok: false, reason: `Score de confiance insuffisant (${score}/${minTrustScore}).` };
  }
  return { ok: true };
}

// Vérouille le collatéral avant de rejoindre une tontine
export async function lockCollateral(
  userId: string, tontineGroupId: string, rounds: number, contributionCents: number, currency: string
): Promise<{ ok: boolean; reason?: string }> {
  if (rounds === 0) return { ok: true };

  const amountToLock = rounds * contributionCents;
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { ok: false, reason: "Wallet introuvable." };

  const locked = await (prisma.walletLock as never).aggregate({
    where: { userId, status: "LOCKED" },
    _sum: { amountCents: true },
  }) as { _sum: { amountCents: number | null } };
  const alreadyLocked = locked._sum.amountCents ?? 0;
  const available = wallet.balanceCents - alreadyLocked;

  if (available < amountToLock) {
    return { ok: false, reason: `Collatéral requis : ${(amountToLock / 100).toFixed(2)} ${currency}. Disponible : ${(available / 100).toFixed(2)} ${currency}.` };
  }

  await (prisma.walletLock as never).create({
    data: {
      id: `lock-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      userId, walletId: wallet.id, tontineGroupId,
      amountCents: amountToLock, currency,
      reason: "COLLATERAL", status: "LOCKED",
    },
  });
  return { ok: true };
}

// Libère le collatéral quand la tontine se termine ou que le membre a honoré sa part
export async function releaseCollateral(userId: string, tontineGroupId: string): Promise<void> {
  await (prisma.walletLock as never).updateMany({
    where: { userId, tontineGroupId, status: "LOCKED" },
    data: { status: "RELEASED", releasedAt: new Date() },
  });
}

// Saisit le collatéral si le membre a une dette après exclusion
export async function seizeCollateral(userId: string, tontineGroupId: string): Promise<number> {
  const locks = await (prisma.walletLock as never).findMany({
    where: { userId, tontineGroupId, status: "LOCKED" },
  }) as { id: string; walletId: string; amountCents: number }[];
  if (!locks.length) return 0;

  const totalSeized = locks.reduce((sum, l) => sum + l.amountCents, 0);
  const wallet = await prisma.wallet.findUnique({ where: { id: locks[0].walletId } });
  if (!wallet) return 0;

  await prisma.$transaction([
    (prisma.walletLock as never).updateMany({
      where: { id: { in: locks.map(l => l.id) } },
      data: { status: "SEIZED", seizedAt: new Date() },
    }),
    // Le montant saisi reste dans le wallet mais est marqué comme utilisé pour la dette
    prisma.transaction.create({
      data: {
        userId, walletId: wallet.id, tontineGroupId,
        type: "COLLATERAL_SEIZED", status: "PAID",
        amountCents: totalSeized, currency: wallet.currency,
        provider: "WALLET",
        reference: `SEIZE-${Date.now()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`,
        riskScore: 0,
        metadata: JSON.stringify({ reason: "debt_unpaid" }),
      },
    }),
  ]);
  return totalSeized;
}
