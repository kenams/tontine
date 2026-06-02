import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCinetpayTransaction } from "@/lib/cinetpay";

export async function POST(request: NextRequest) {
  let body: { cpm_trans_id?: string; cpm_site_id?: string; cpm_result?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const txRef = body.cpm_trans_id;
  const result = body.cpm_result;

  if (!txRef) return NextResponse.json({ ok: true, ignored: true });

  if (result !== "00") {
    await prisma.transaction.updateMany({ where: { reference: txRef, status: "PENDING" }, data: { status: "FAILED" } });
    return NextResponse.json({ ok: true });
  }

  const pending = await prisma.transaction.findFirst({
    where: { reference: txRef, status: "PENDING" },
  });
  if (!pending || !pending.walletId) return NextResponse.json({ ok: true, skipped: "no_pending" });

  // Double-vérification côté API CinetPay
  const verification = await verifyCinetpayTransaction(txRef);
  if (!verification.ok || verification.status !== "ACCEPTED") {
    return NextResponse.json({ ok: true, skipped: "verification_failed" });
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
