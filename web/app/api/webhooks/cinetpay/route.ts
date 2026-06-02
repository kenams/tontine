import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCinetpayTransaction } from "@/lib/cinetpay";

export async function POST(request: NextRequest) {
  let body: { merchant_transaction_id?: string; status?: string } = {};
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const txRef = body.merchant_transaction_id;
  if (!txRef) return NextResponse.json({ ok: true, ignored: true });

  const pending = await prisma.transaction.findFirst({
    where: { reference: txRef, status: "PENDING" },
  });
  if (!pending || !pending.walletId) return NextResponse.json({ ok: true, skipped: "no_pending" });

  // Re-vérifier via API — ne jamais faire confiance au payload webhook
  const verification = await verifyCinetpayTransaction(txRef);

  if (!verification.ok || verification.status === "FAILED") {
    await prisma.transaction.update({ where: { id: pending.id }, data: { status: "FAILED" } });
    return NextResponse.json({ ok: true });
  }

  if (verification.status !== "SUCCESS") {
    return NextResponse.json({ ok: true, skipped: "not_final" });
  }

  await prisma.$transaction([
    prisma.wallet.update({ where: { id: pending.walletId }, data: { balanceCents: { increment: pending.amountCents } } }),
    prisma.transaction.update({ where: { id: pending.id }, data: { status: "PAID" } }),
    prisma.notification.create({
      data: {
        userId: pending.userId,
        title: "✅ Mobile Money reçu",
        body: `${(pending.amountCents / 100).toLocaleString("fr-FR")} ${pending.currency} crédités sur votre wallet.`,
        type: "WALLET_DEPOSIT",
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
