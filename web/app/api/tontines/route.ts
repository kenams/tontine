import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { awardFounder } from "@/lib/badges";
import { amountToMinorUnits } from "@/lib/currency";
import { getUserTontines } from "@/lib/data";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { createTontineSchema } from "@/lib/validators";

const dueDays: Record<string, number> = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 42);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const tontines = await getUserTontines(session.userId);
  return NextResponse.json({ tontines });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const limit = await rateLimit(request, "create-tontine", 8, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Creation limitee temporairement." }, { status: 429 });

  const parsed = createTontineSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Donnees de tontine invalides." }, { status: 400 });

  // Limite plan FREE : 1 tontine créée
  const userPlan = await prisma.user.findUnique({ where: { id: session.userId }, select: { plan: true } as never }) as { plan: string } | null;
  if (userPlan?.plan !== "PREMIUM") {
    const existing = await prisma.tontineGroup.count({ where: { createdById: session.userId, status: { not: "COMPLETED" } } });
    if (existing >= 1) {
      return NextResponse.json({ error: "Plan gratuit limité à 1 tontine active. Passez Premium pour en créer plus.", premiumRequired: true }, { status: 403 });
    }
  }

  const contributionCents = amountToMinorUnits(parsed.data.contributionAmount, parsed.data.currency);

  // ── FIX D : collatéral automatique pour Saphir+ (≥ 500€/mois) ───────────────
  // Saphir = 500-1499€ → 1 round de collatéral obligatoire
  // Rubis+ = 1500€+    → 2 rounds de collatéral obligatoires
  const autoCollateralRounds =
    contributionCents >= 150_000 ? 2 :  // 1 500€+
    contributionCents >= 50_000  ? 1 :  // 500€+
    0;

  // KYC obligatoire pour rejoindre les tontines à fort enjeu (≥ 150€/mois = Émeraude+)
  const kycRequiredToJoin = contributionCents >= 15_000;

  const baseSlug = slugify(parsed.data.name);
  const group = await prisma.tontineGroup.create({
    data: {
      name: parsed.data.name,
      slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
      description: parsed.data.description,
      contributionCents,
      currency: parsed.data.currency,
      frequency: parsed.data.frequency,
      maxMembers: parsed.data.maxMembers,
      rules: parsed.data.rules,
      joinCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
      nextDueAt: new Date(Date.now() + dueDays[parsed.data.frequency] * 24 * 60 * 60 * 1000),
      createdById: session.userId,
      minTrustScore: parsed.data.minTrustScore,
      requireFullPayment: parsed.data.requireFullPayment,
      autoExcludeDays: parsed.data.autoExcludeDays,
      collateralRounds: autoCollateralRounds,
      kycRequiredToJoin,
      memberships: {
        create: { userId: session.userId, role: "ORGANIZER", payoutOrder: 1, paidThisRound: false },
      },
      emergencyFund: {
        create: {
          balanceCents: 0,
          targetCents: amountToMinorUnits(parsed.data.contributionAmount, parsed.data.currency) * 2,
          loanPoolCents: 0,
          currency: parsed.data.currency,
        },
      },
    } as never,
  });

  await auditLog({ actorId: session.userId, action: "TONTINE_CREATED", targetType: "TontineGroup", targetId: group.id, ipAddress: clientIp(request) });
  void awardFounder(session.userId);

  return NextResponse.json({ group }, { status: 201 });
}
