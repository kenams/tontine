import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { safeJson } from "@/lib/request";
import { createSepaBankTransferPaymentIntent, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const limit = await rateLimit(request, "wallet-deposit-sepa", 3, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });

  if (!isStripeConfigured()) return NextResponse.json({ error: "Stripe non configuré." }, { status: 503 });

  let amountCents: number;
  try {
    const body = await safeJson(request) as { amountCents?: unknown };
    amountCents = Number(body.amountCents);
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (!Number.isInteger(amountCents) || amountCents < 500 || amountCents > 500_000_00) {
    return NextResponse.json({ error: "Montant invalide (min 5 €, max 5 000 €)." }, { status: 400 });
  }

  const [user, wallet] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, fullName: true, stripeCustomerId: true } as never }),
    prisma.wallet.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, balanceCents: 0, currency: "EUR", status: "ACTIVE" },
      update: {},
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const reference = `SEPA-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.userId,
      walletId: wallet.id,
      type: "WALLET_DEPOSIT",
      status: "PENDING",
      amountCents,
      currency: "EUR",
      provider: "SEPA",
      reference,
      riskScore: 8,
      metadata: JSON.stringify({ mode: "sepa_bank_transfer", depositStatus: "AWAITING_TRANSFER" }),
    },
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = user as any;
    const instructions = await createSepaBankTransferPaymentIntent({
      user: { id: u.id, email: u.email, fullName: u.fullName, stripeCustomerId: u.stripeCustomerId },
      walletId: wallet.id,
      transactionId: transaction.id,
      amountCents,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        metadata: JSON.stringify({
          mode: "sepa_bank_transfer",
          paymentIntentId: instructions.paymentIntentId,
          iban: instructions.iban.slice(0, 8) + "****",
          reference: instructions.reference,
          depositStatus: "AWAITING_TRANSFER",
        }),
      },
    });

    await auditLog({
      actorId: session.userId,
      action: "WALLET_DEPOSIT_SEPA_CREATED",
      targetType: "Wallet",
      targetId: wallet.id,
      ipAddress: clientIp(request),
      metadata: { amountCents, paymentIntentId: instructions.paymentIntentId },
    });

    return NextResponse.json({ ok: true, instructions });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "stripe_error";
    console.error("[wallet/deposit/sepa]", errMsg);
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED", metadata: JSON.stringify({ error: errMsg }) },
    });
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }
}
