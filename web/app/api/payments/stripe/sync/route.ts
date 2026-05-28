import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const syncSchema = z.object({
  sessionId: z.string().min(8)
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const parsed = syncSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Session Stripe invalide." }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe non configure." }, { status: 503 });

  const checkout = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);
  const metadata = checkout.metadata ?? {};

  if (!metadata.userId || !metadata.transactionId || !metadata.contributionId || !metadata.tontineGroupId) {
    return NextResponse.json({ error: "Metadonnees Stripe incompletes." }, { status: 400 });
  }

  if (session.role !== "ADMIN" && metadata.userId !== session.userId) {
    return NextResponse.json({ error: "Session Stripe non autorisee." }, { status: 403 });
  }

  if (checkout.payment_status !== "paid") {
    return NextResponse.json({
      ok: true,
      status: "PENDING",
      paymentStatus: checkout.payment_status,
      checkoutStatus: checkout.status
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: metadata.transactionId },
      data: {
        status: "PAID",
        riskScore: 7,
        metadata: JSON.stringify({
          mode: "stripe_checkout",
          provider: metadata.provider ?? "STRIPE",
          syncSource: "success_return",
          checkoutSessionId: checkout.id,
          paymentIntentId: typeof checkout.payment_intent === "string" ? checkout.payment_intent : checkout.payment_intent?.id,
          paymentStatus: checkout.payment_status
        })
      }
    });
    await tx.contribution.update({
      where: { id: metadata.contributionId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentProvider: metadata.provider ?? "STRIPE"
      }
    });
    await tx.membership.updateMany({
      where: { userId: metadata.userId, tontineGroupId: metadata.tontineGroupId },
      data: { paidThisRound: true, status: "ACTIVE" }
    });
    await tx.adminLog.create({
      data: {
        actorId: metadata.userId,
        action: "STRIPE_RETURN_SYNC_PAID",
        targetType: "Transaction",
        targetId: metadata.transactionId,
        metadata: JSON.stringify({ sessionId: checkout.id, paymentStatus: checkout.payment_status })
      }
    });
  });

  return NextResponse.json({ ok: true, status: "PAID", paymentStatus: checkout.payment_status });
}
