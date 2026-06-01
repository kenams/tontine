import "server-only";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

const REFERRAL_REWARD_CENTS = 500; // 5€

export function generateReferralCode(userId: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;
  let code: string;
  let attempts = 0;
  do {
    code = generateReferralCode(userId);
    attempts++;
  } while (attempts < 10 && await prisma.user.findUnique({ where: { referralCode: code } }));
  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } as never });
  return code;
}

export async function processReferral(referredUserId: string, referralCode: string): Promise<void> {
  const referrer = await prisma.user.findUnique({ where: { referralCode }, select: { id: true } });
  if (!referrer || referrer.id === referredUserId) return;

  const existing = await prisma.referral.findUnique({ where: { referredId: referredUserId } } as never);
  if (existing) return;

  await prisma.$transaction([
    (prisma.referral as never).create({
      data: {
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        referrerId: referrer.id,
        referredId: referredUserId,
        status: "PENDING",
        rewardCents: REFERRAL_REWARD_CENTS,
      },
    }),
    prisma.user.update({ where: { id: referredUserId }, data: { referredById: referrer.id } as never }),
  ]);
}

// Appelée quand le filleul fait son premier dépôt ou première cotisation
export async function rewardReferrer(referredUserId: string): Promise<void> {
  const referral = await (prisma.referral as never).findFirst({
    where: { referredId: referredUserId, status: "PENDING" },
  }) as { id: string; referrerId: string; rewardCents: number } | null;
  if (!referral) return;

  const wallet = await prisma.wallet.findUnique({ where: { userId: referral.referrerId } });
  if (!wallet) return;

  await prisma.$transaction([
    prisma.wallet.update({ where: { id: wallet.id }, data: { balanceCents: { increment: referral.rewardCents } } }),
    (prisma.referral as never).update({
      where: { id: referral.id },
      data: { status: "REWARDED", rewardedAt: new Date() },
    }),
    prisma.transaction.create({
      data: {
        userId: referral.referrerId,
        walletId: wallet.id,
        type: "REFERRAL_REWARD",
        status: "PAID",
        amountCents: referral.rewardCents,
        currency: wallet.currency,
        provider: "WALLET",
        reference: `REF-${referral.id}`,
        riskScore: 0,
        metadata: JSON.stringify({ referredUserId }),
      },
    }),
    prisma.notification.create({
      data: {
        userId: referral.referrerId,
        title: "🎁 Récompense parrainage !",
        body: `Votre filleul a effectué sa première action. ${(referral.rewardCents / 100).toFixed(2)}€ crédités sur votre wallet !`,
        type: "REFERRAL",
      },
    }),
  ]);

  void sendPushToUser(referral.referrerId, {
    title: "🎁 Récompense parrainage !",
    body: `${(referral.rewardCents / 100).toFixed(2)}€ crédités sur votre wallet Kotizy`,
    url: "/wallet",
  });
}
