import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Route temporaire — supprimée après migration
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const results: string[] = [];

  const run = async (label: string, sql: string) => {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${label}`);
    } catch (e) {
      results.push(`SKIP: ${label} — ${(e as Error).message.slice(0, 80)}`);
    }
  };

  await run("User.plan", `ALTER TABLE tontineapp."User" ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'FREE'`);
  await run("User.referralCode", `ALTER TABLE tontineapp."User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT`);
  await run("User.referredById", `ALTER TABLE tontineapp."User" ADD COLUMN IF NOT EXISTS "referredById" TEXT`);
  await run("TontineGroup.isPublic", `ALTER TABLE tontineapp."TontineGroup" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false`);
  await run("TontineGroup.payoutMode", `ALTER TABLE tontineapp."TontineGroup" ADD COLUMN IF NOT EXISTS "payoutMode" TEXT NOT NULL DEFAULT 'ORDERED'`);
  await run("TontineGroup.collateralRounds", `ALTER TABLE tontineapp."TontineGroup" ADD COLUMN IF NOT EXISTS "collateralRounds" INTEGER NOT NULL DEFAULT 0`);
  await run("idx User.referralCode", `CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON tontineapp."User"("referralCode")`);
  await run("idx TontineGroup.isPublic", `CREATE INDEX IF NOT EXISTS "TontineGroup_isPublic_idx" ON tontineapp."TontineGroup"("isPublic")`);

  await run("CREATE Referral", `CREATE TABLE IF NOT EXISTS tontineapp."Referral" (
    id TEXT NOT NULL, "referrerId" TEXT NOT NULL, "referredId" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', "rewardCents" INTEGER NOT NULL DEFAULT 500,
    "rewardedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY (id)
  )`);
  await run("idx Referral.referredId", `CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredId_key" ON tontineapp."Referral"("referredId")`);
  await run("idx Referral.referrerId", `CREATE INDEX IF NOT EXISTS "Referral_referrerId_idx" ON tontineapp."Referral"("referrerId")`);
  await run("idx Referral.status", `CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON tontineapp."Referral"(status)`);

  await run("CREATE Subscription", `CREATE TABLE IF NOT EXISTS tontineapp."Subscription" (
    id TEXT NOT NULL, "userId" TEXT NOT NULL, plan TEXT NOT NULL DEFAULT 'FREE',
    status TEXT NOT NULL DEFAULT 'ACTIVE', "stripeSubscriptionId" TEXT, "stripePriceId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3), "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY (id)
  )`);
  await run("idx Subscription.userId", `CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON tontineapp."Subscription"("userId")`);
  await run("idx Subscription.stripeSubId", `CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON tontineapp."Subscription"("stripeSubscriptionId")`);

  await run("CREATE WalletLock", `CREATE TABLE IF NOT EXISTS tontineapp."WalletLock" (
    id TEXT NOT NULL, "userId" TEXT NOT NULL, "walletId" TEXT NOT NULL,
    "tontineGroupId" TEXT NOT NULL, "amountCents" INTEGER NOT NULL, currency TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'COLLATERAL', status TEXT NOT NULL DEFAULT 'LOCKED',
    "releasedAt" TIMESTAMP(3), "seizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletLock_pkey" PRIMARY KEY (id)
  )`);
  await run("idx WalletLock.userId", `CREATE INDEX IF NOT EXISTS "WalletLock_userId_idx" ON tontineapp."WalletLock"("userId")`);
  await run("idx WalletLock.tontineGroupId", `CREATE INDEX IF NOT EXISTS "WalletLock_tontineGroupId_idx" ON tontineapp."WalletLock"("tontineGroupId")`);
  await run("idx WalletLock.status", `CREATE INDEX IF NOT EXISTS "WalletLock_status_idx" ON tontineapp."WalletLock"(status)`);

  return NextResponse.json({ ok: true, results });
}
