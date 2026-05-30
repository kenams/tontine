import { revalidateTag } from "next/cache";
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

async function creditWallet(session: Stripe.Checkout.Session, eventType: string) {
  const walletId = session.metadata?.walletId;
  const transactionId = session.metadata?.transactionId;
  const userId = session.metadata?.userId;
  if (!walletId || !transactionId || !userId) return { updated: false, reason: "missing_metadata" };

  await prisma.$transaction(async (tx) => {
    const txRecord = await tx.transaction.findUnique({ where: { id: transactionId }, select: { amountCents: true } });
    if (!txRecord) throw new Error("transaction_not_found");

    await tx.wallet.update({
      where: { id: walletId },
      data: { balanceCents: { increment: txRecord.amountCents } },
    });
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: "PAID",
        riskScore: 5,
        metadata: JSON.stringify({
          mode: "stripe_checkout",
          type: "WALLET_DEPOSIT",
          eventType,
          checkoutSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          paymentStatus: session.payment_status,
        }),
      },
    });
    await tx.notification.create({
      data: {
        userId,
        title: "Wallet rechargé",
        body: "Votre recharge Stripe a été créditée sur votre wallet Kotizy.",
        type: "PAYMENT",
      },
    });
    await tx.adminLog.create({
      data: {
        actorId: userId,
        action: "WALLET_DEPOSIT_CONFIRMED",
        targetType: "Wallet",
        targetId: walletId,
        metadata: JSON.stringify({ eventType, sessionId: session.id }),
      },
    });
  });

  // Invalider le cache dashboard de cet utilisateur
  revalidateTag(`user-${userId}`);

  return { updated: true };
}

async function failWalletDeposit(session: Stripe.Checkout.Session, eventType: string) {
  const transactionId = session.metadata?.transactionId;
  if (!transactionId) return { updated: false, reason: "missing_metadata" };

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: "FAILED",
      riskScore: 50,
      metadata: JSON.stringify({ mode: "stripe_checkout", type: "WALLET_DEPOSIT", eventType, checkoutSessionId: session.id }),
    },
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
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.type === "WALLET_DEPOSIT") {
      const result = await creditWallet(session, event.type);
      return NextResponse.json({ received: true, ...result });
    }
    const result = await markPaid(session, event.type);
    return NextResponse.json({ received: true, ...result });
  }

  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.type === "WALLET_DEPOSIT") {
      const result = await failWalletDeposit(session, event.type);
      return NextResponse.json({ received: true, ...result });
    }
    const result = await markFailed(session, event.type);
    return NextResponse.json({ received: true, ...result });
  }

  // PaymentIntent succeeded — SEPA virement (1-3j) OU paiement natif mobile (instantané)
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    // Paiement natif mobile (Stripe SDK iOS/Android) — créditer wallet immédiatement
    if (pi.metadata?.type === "WALLET_DEPOSIT" && pi.metadata?.walletId) {
      const walletId = pi.metadata.walletId;
      const transactionId = pi.metadata.transactionId;
      const userId = pi.metadata.userId;
      if (walletId && transactionId && userId) {
        await prisma.$transaction(async (tx) => {
          const txRecord = await tx.transaction.findUnique({ where: { id: transactionId }, select: { amountCents: true } });
          if (!txRecord) return;
          await tx.wallet.update({ where: { id: walletId }, data: { balanceCents: { increment: txRecord.amountCents } } });
          await tx.transaction.update({
            where: { id: transactionId },
            data: { status: "PAID", riskScore: 5, metadata: JSON.stringify({ mode: "stripe_native", paymentIntentId: pi.id, type: "WALLET_DEPOSIT" }) },
          });
          await tx.notification.create({
            data: { userId, title: "Dépôt confirmé ✅", body: "Votre wallet a été crédité via le paiement mobile.", type: "PAYMENT" },
          });
        });
        revalidateTag(`user-${userId}`);
        return NextResponse.json({ received: true, updated: true });
      }
    }

    if (pi.metadata?.type === "WALLET_DEPOSIT_SEPA") {
      const walletId = pi.metadata.walletId;
      const transactionId = pi.metadata.transactionId;
      const userId = pi.metadata.userId;
      if (walletId && transactionId && userId) {
        await prisma.$transaction(async (tx) => {
          const txRecord = await tx.transaction.findUnique({ where: { id: transactionId }, select: { amountCents: true } });
          if (!txRecord) return;
          await tx.wallet.update({ where: { id: walletId }, data: { balanceCents: { increment: txRecord.amountCents } } });
          await tx.transaction.update({
            where: { id: transactionId },
            data: { status: "PAID", metadata: JSON.stringify({ mode: "sepa_bank_transfer", paymentIntentId: pi.id, type: "WALLET_DEPOSIT_SEPA" }) },
          });
          await tx.notification.create({
            data: { userId, title: "Virement SEPA reçu ✅", body: "Votre virement a été reçu et crédité sur votre wallet Kotizy.", type: "PAYMENT" },
          });
        });
        revalidateTag(`user-${userId}`);
        return NextResponse.json({ received: true, updated: true });
      }
    }
  }

  return NextResponse.json({ received: true, ignored: event.type });
}
