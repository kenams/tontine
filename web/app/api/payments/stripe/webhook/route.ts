import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

function sessionMetadata(session: Stripe.Checkout.Session) {
  return {
    transactionId: session.metadata?.transactionId,
    contributionId: session.metadata?.contributionId,
    userId: session.metadata?.userId,
    tontineGroupId: session.metadata?.tontineGroupId,
    provider: session.metadata?.provider ?? "STRIPE"
  };
}

async function markPaid(session: Stripe.Checkout.Session, eventType: string) {
  const metadata = sessionMetadata(session);
  if (!metadata.transactionId || !metadata.contributionId || !metadata.userId || !metadata.tontineGroupId) {
    return { updated: false, reason: "missing_metadata" };
  }
  const transactionId = metadata.transactionId;
  const contributionId = metadata.contributionId;
  const userId = metadata.userId;
  const tontineGroupId = metadata.tontineGroupId;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: "PAID",
        riskScore: 7,
        metadata: JSON.stringify({
          mode: "stripe_checkout",
          provider: metadata.provider,
          eventType,
          checkoutSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          paymentStatus: session.payment_status
        })
      }
    });
    await tx.contribution.update({
      where: { id: contributionId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentProvider: metadata.provider
      }
    });
    await tx.membership.updateMany({
      where: { userId, tontineGroupId },
      data: { paidThisRound: true, status: "ACTIVE" }
    });
    await tx.notification.create({
      data: {
        userId,
        tontineGroupId,
        title: "Paiement Stripe confirme",
        body: "Votre cotisation a ete validee automatiquement.",
        type: "PAYMENT"
      }
    });
    await tx.adminLog.create({
      data: {
        actorId: userId,
        action: "STRIPE_WEBHOOK_PAID",
        targetType: "Transaction",
        targetId: transactionId,
        metadata: JSON.stringify({ eventType, sessionId: session.id })
      }
    });
  });

  return { updated: true };
}

async function markFailed(session: Stripe.Checkout.Session, eventType: string) {
  const metadata = sessionMetadata(session);
  if (!metadata.transactionId || !metadata.contributionId) return { updated: false, reason: "missing_metadata" };

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: metadata.transactionId },
      data: {
        status: "FAILED",
        riskScore: 52,
        metadata: JSON.stringify({
          mode: "stripe_checkout",
          provider: metadata.provider,
          eventType,
          checkoutSessionId: session.id,
          paymentStatus: session.payment_status
        })
      }
    });
    await tx.contribution.update({
      where: { id: metadata.contributionId },
      data: { status: "FAILED" }
    });
    if (metadata.userId && metadata.tontineGroupId) {
      await tx.membership.updateMany({
        where: { userId: metadata.userId, tontineGroupId: metadata.tontineGroupId },
        data: { paidThisRound: false, status: "LATE" }
      });
    }
    await tx.adminLog.create({
      data: {
        actorId: metadata.userId,
        action: "STRIPE_WEBHOOK_FAILED",
        targetType: "Transaction",
        targetId: metadata.transactionId,
        metadata: JSON.stringify({ eventType, sessionId: session.id })
      }
    });
  });

  return { updated: true };
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    if (webhookSecret) {
      if (!stripe || !signature) {
        return NextResponse.json({ error: "Signature Stripe manquante." }, { status: 400 });
      }
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      event = JSON.parse(payload) as Stripe.Event;
    }
  } catch {
    return NextResponse.json({ error: "Signature Stripe invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const result = await markPaid(event.data.object as Stripe.Checkout.Session, event.type);
    return NextResponse.json({ received: true, ...result });
  }

  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const result = await markFailed(event.data.object as Stripe.Checkout.Session, event.type);
    return NextResponse.json({ received: true, ...result });
  }

  return NextResponse.json({ received: true, ignored: event.type });
}
