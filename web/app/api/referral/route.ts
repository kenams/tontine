import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrCreateReferralCode } from "@/lib/referral";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const code = await getOrCreateReferralCode(session.userId);
  const referrals = await (prisma.referral as never).findMany({
    where: { referrerId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  }) as { id: string; status: string; rewardCents: number; rewardedAt: Date | null; createdAt: Date }[];

  const rewarded = referrals.filter(r => r.status === "REWARDED").length;
  const pending = referrals.filter(r => r.status === "PENDING").length;
  const totalEarned = referrals.filter(r => r.status === "REWARDED").reduce((s, r) => s + r.rewardCents, 0);

  return NextResponse.json({
    code,
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app"}/register?ref=${code}`,
    stats: { rewarded, pending, totalEarned },
    referrals,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json() as { code?: string };
  if (!body.code) return NextResponse.json({ error: "Code manquant." }, { status: 400 });

  const referrer = await prisma.user.findUnique({
    where: { referralCode: body.code },
    select: { id: true, fullName: true },
  } as never) as { id: string; fullName: string } | null;

  if (!referrer) return NextResponse.json({ error: "Code invalide." }, { status: 404 });
  if (referrer.id === session.userId) return NextResponse.json({ error: "Vous ne pouvez pas vous parrainer vous-même." }, { status: 400 });

  const existing = await (prisma.referral as never).findUnique({ where: { referredId: session.userId } });
  if (existing) return NextResponse.json({ error: "Vous avez déjà un parrain." }, { status: 409 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { referredById: true } } as never) as { referredById: string | null } | null;
  if (user?.referredById) return NextResponse.json({ error: "Vous avez déjà un parrain." }, { status: 409 });

  await prisma.$transaction([
    (prisma.referral as never).create({
      data: {
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        referrerId: referrer.id,
        referredId: session.userId,
        status: "PENDING",
        rewardCents: 500,
      },
    }),
    prisma.user.update({ where: { id: session.userId }, data: { referredById: referrer.id } as never }),
  ]);

  return NextResponse.json({ ok: true, referrerName: referrer.fullName });
}
