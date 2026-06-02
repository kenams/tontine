import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCinetpayTransaction } from "@/lib/cinetpay";

// Accepter GET pour la sonde de santé CinetPay
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  let body: {
    notify_token?: string;
    merchant_transaction_id?: string;
    transaction_id?: string;
  } = {};
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const txRef = body.merchant_transaction_id;
  const cinetpayTxId = body.transaction_id;
  if (!txRef) return NextResponse.json({ ok: true, ignored: true });

  const pending = await prisma.transaction.findFirst({
    where: { reference: txRef },
  });
  if (!pending || !pending.walletId) return NextResponse.json({ ok: true, skipped: "no_pending" });

  // Valider le notify_token contre celui stocké lors de l'init
  const meta = pending.metadata ? JSON.parse(pending.metadata as string) : {};
  if (meta.notifyToken && body.notify_token && meta.notifyToken !== body.notify_token) {
    return NextResponse.json({ error: "notify_token invalide." }, { status: 403 });
  }

  // Idempotence — transaction_id CinetPay déjà traité
  if (cinetpayTxId && meta.lastCinetpayTxId === cinetpayTxId) {
    return NextResponse.json({ ok: true, skipped: "already_processed" });
  }

  if (pending.status === "PAID") return NextResponse.json({ ok: true, skipped: "already_paid" });

  // Re-vérifier via API — source de vérité canonique
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
    prisma.transaction.update({
      where: { id: pending.id },
      data: {
        status: "PAID",
        metadata: JSON.stringify({ ...meta, lastCinetpayTxId: cinetpayTxId }),
      },
    }),
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
