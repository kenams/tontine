import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { createWalletDepositCheckoutSession, isStripeConfigured, stripeDepositCurrency } from "@/lib/stripe";

const VALID_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000, 50000];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const limit = await rateLimit(request, "wallet-deposit", 5, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans une minute." }, { status: 429 });

  let amountCents: number;
  try {
    const body = await request.json();
    amountCents = Number(body.amountCents);
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (!Number.isInteger(amountCents) || amountCents < 500 || amountCents > 50_000_00) {
    return NextResponse.json({ error: "Montant invalide (min 5 €, max 5 000 €)." }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe non configuré sur cet environnement." }, { status: 503 });
  }

  const wallet = await prisma.wallet.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, balanceCents: 0, currency: "EUR", status: "ACTIVE" },
    update: {},
  });

  const currency = stripeDepositCurrency(wallet.currency);
  const reference = `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.userId,
      walletId: wallet.id,
      type: "WALLET_DEPOSIT",
      status: "PENDING",
      amountCents,
      currency: currency.toUpperCase(),
      provider: "STRIPE",
      reference,
      riskScore: 10,
      metadata: JSON.stringify({ mode: "stripe_checkout", depositStatus: "PENDING" }),
    },
  });

  try {
    const checkout = await createWalletDepositCheckoutSession({
      request,
      user: { id: session.userId, email: session.email, fullName: session.fullName },
      walletId: wallet.id,
      transactionId: transaction.id,
      amountCents,
      currency,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        metadata: JSON.stringify({
          mode: "stripe_checkout",
          checkoutSessionId: checkout.id,
          depositStatus: "PENDING",
        }),
      },
    });

    await auditLog({
      actorId: session.userId,
      action: "WALLET_DEPOSIT_CHECKOUT_CREATED",
      targetType: "Wallet",
      targetId: wallet.id,
      ipAddress: clientIp(request),
      metadata: { sessionId: checkout.id, amountCents, currency },
    });

    return NextResponse.json({ ok: true, checkoutUrl: checkout.url, sessionId: checkout.id });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "stripe_error";
    console.error("[wallet/deposit] Stripe error:", errMsg);
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED", metadata: JSON.stringify({ error: errMsg }) },
    });

    return NextResponse.json({ error: "Impossible de créer la session Stripe.", detail: errMsg }, { status: 502 });
  }
}
