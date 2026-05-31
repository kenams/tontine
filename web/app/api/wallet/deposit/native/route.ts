/**
 * Endpoint pour dépôt wallet via le SDK Stripe natif (iOS/Android).
 * Retourne un PaymentIntent client_secret — pas une URL de redirection browser.
 * Le webhook payment_intent.succeeded crédite le wallet automatiquement.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { safeJson } from "@/lib/request";
import { getStripe, isStripeConfigured, stripeDepositCurrency } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const limit = await rateLimit(request, "wallet-deposit-native", 5, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans une minute." }, { status: 429 });

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe non configuré sur cet environnement." }, { status: 503 });
  }

  let amountCents: number;
  try {
    const body = await safeJson(request) as { amountCents?: unknown };
    amountCents = Number(body.amountCents);
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 500_000_00) {
    return NextResponse.json({ error: "Montant invalide (min 1 €, max 5 000 €)." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe non disponible." }, { status: 503 });

  const wallet = await prisma.wallet.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, balanceCents: 0, currency: "EUR", status: "ACTIVE" },
    update: {},
  });

  const currency = stripeDepositCurrency(wallet.currency);
  const reference = `NAT-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.userId,
      walletId: wallet.id,
      type: "WALLET_DEPOSIT",
      status: "PENDING",
      amountCents,
      currency: currency.toUpperCase(),
      provider: "STRIPE_NATIVE",
      reference,
      riskScore: 10,
      metadata: JSON.stringify({ mode: "stripe_native", depositStatus: "PENDING" }),
    },
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pi = await (stripe.paymentIntents.create as any)({
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "WALLET_DEPOSIT",
        transactionId: transaction.id,
        walletId: wallet.id,
        userId: session.userId,
        currency,
      },
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { metadata: JSON.stringify({ mode: "stripe_native", paymentIntentId: pi.id }) },
    });

    await auditLog({
      actorId: session.userId,
      action: "WALLET_DEPOSIT_NATIVE_CREATED",
      targetType: "Wallet",
      targetId: wallet.id,
      ipAddress: clientIp(request),
      metadata: { amountCents, currency, paymentIntentId: pi.id },
    });

    return NextResponse.json({
      ok: true,
      clientSecret: pi.client_secret,
      transactionId: transaction.id,
      amountCents,
      currency: currency.toUpperCase(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "stripe_error";
    console.error("[wallet/deposit/native]", errMsg);
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED", metadata: JSON.stringify({ error: errMsg }) },
    });
    return NextResponse.json({ error: "Création du paiement impossible.", detail: errMsg }, { status: 502 });
  }
}
