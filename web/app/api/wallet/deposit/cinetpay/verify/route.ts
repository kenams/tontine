import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyCinetpayTransaction } from "@/lib/cinetpay";

export async function GET(request: NextRequest) {
  const session = await requireUser();
  const { searchParams } = new URL(request.url);
  const txRef = searchParams.get("tx_ref");

  if (!txRef) return NextResponse.json({ error: "Paramètre tx_ref manquant." }, { status: 400 });

  const pending = await prisma.transaction.findFirst({
    where: { reference: txRef, userId: session.userId },
  });
  if (!pending) return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });

  if (pending.status === "PAID") {
    return NextResponse.json({ ok: true, alreadyCredited: true, amountCents: pending.amountCents, currency: pending.currency });
  }

  // Toujours re-vérifier via l'API (ne jamais faire confiance au status de la callback)
  const verification = await verifyCinetpayTransaction(txRef);
  if (!verification.ok || verification.status !== "SUCCESS") {
    if (verification.status === "FAILED") {
      await prisma.transaction.update({ where: { id: pending.id }, data: { status: "FAILED" } });
    }
    return NextResponse.json({ ok: false, status: verification.status ?? "failed", error: verification.error });
  }

  if (!pending.walletId) return NextResponse.json({ error: "Wallet introuvable." }, { status: 404 });

  await prisma.$transaction([
    prisma.wallet.update({ where: { id: pending.walletId }, data: { balanceCents: { increment: pending.amountCents } } }),
    prisma.transaction.update({ where: { id: pending.id }, data: { status: "PAID", provider: "CINETPAY" } }),
    prisma.notification.create({
      data: {
        userId: session.userId,
        title: "✅ Recharge Mobile Money confirmée",
        body: `${(pending.amountCents / 100).toLocaleString("fr-FR")} ${pending.currency} crédités sur votre wallet Kotizy.`,
        type: "WALLET_DEPOSIT",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, amountCents: pending.amountCents, currency: pending.currency });
}
