import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog, clientIp, rateLimit } from "@/lib/security";
import { safeJson } from "@/lib/request";

const withdrawSchema = z.object({
  amountCents: z.number().int().min(100_00).max(200_000_00),
  iban: z.string().min(15).max(34).regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/, "IBAN invalide"),
  beneficiary: z.string().min(2).max(80),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const limit = await rateLimit(request, "wallet-withdraw", 3, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans une minute." }, { status: 429 });

  const parsed = withdrawSchema.safeParse(await safeJson(request));
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { amountCents, iban, beneficiary } = parsed.data;

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) return NextResponse.json({ error: "Wallet introuvable." }, { status: 404 });
  if (wallet.balanceCents < amountCents) {
    return NextResponse.json({ error: `Solde insuffisant. Disponible : ${(wallet.balanceCents / 100).toFixed(2)} ${wallet.currency}.` }, { status: 400 });
  }

  const reference = `WIT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balanceCents: { decrement: amountCents } },
    });
    await tx.transaction.create({
      data: {
        userId: session.userId,
        walletId: wallet.id,
        type: "WALLET_WITHDRAWAL",
        status: "PENDING",
        amountCents,
        currency: wallet.currency,
        provider: "BANK_TRANSFER",
        reference,
        riskScore: 12,
        metadata: JSON.stringify({ iban: iban.slice(0, 8) + "****", beneficiary }),
      },
    });
    await tx.notification.create({
      data: {
        userId: session.userId,
        title: "Retrait en cours de traitement",
        body: `Retrait de ${(amountCents / 100).toFixed(2)} ${wallet.currency} vers votre IBAN soumis. Délai : 1-3 jours ouvrés.`,
        type: "PAYMENT",
      },
    });
    await tx.adminLog.create({
      data: {
        actorId: session.userId,
        action: "WALLET_WITHDRAWAL_REQUESTED",
        targetType: "Wallet",
        targetId: wallet.id,
        metadata: JSON.stringify({ amountCents, currency: wallet.currency, iban: iban.slice(0, 8) + "****", reference }),
      },
    });
  });

  return NextResponse.json({ ok: true, reference, status: "PENDING" });
}
