import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { verifyCinetPayPayment } from "@/lib/cinetpay";
import { prisma } from "@/lib/db";

// Webhook CinetPay — POST notifié quand le paiement est confirmé
export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => ({})) as Record<string, string>;
  } else {
    // CinetPay envoie parfois en form-data
    const formData = await request.formData().catch(() => new FormData());
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
  }

  const transactionId = body.cpm_trans_id ?? body.transaction_id;
  if (!transactionId) return NextResponse.json({ received: true, skipped: "no_transaction_id" });

  // Trouver la transaction en DB
  const tx = await prisma.transaction.findUnique({
    where: { reference: transactionId },
    include: { wallet: true },
  });

  if (!tx || tx.status !== "PENDING") {
    return NextResponse.json({ received: true, skipped: "not_found_or_already_processed" });
  }

  // Vérifier le paiement auprès de CinetPay (évite les webhooks falsifiés)
  const verification = await verifyCinetPayPayment(transactionId);

  if (!verification.success) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "FAILED", metadata: JSON.stringify({ reason: "cinetpay_verification_failed" }) },
    });
    return NextResponse.json({ received: true, status: "FAILED" });
  }

  // Créditer le wallet
  await prisma.$transaction(async (t) => {
    await t.wallet.update({
      where: { id: tx.walletId! },
      data: { balanceCents: { increment: tx.amountCents } },
    });
    await t.transaction.update({
      where: { id: tx.id },
      data: { status: "PAID", metadata: JSON.stringify({ mode: "cinetpay", verified: true, provider: body.payment_method }) },
    });
    await t.notification.create({
      data: {
        userId: tx.userId,
        title: "Mobile Money reçu ✅",
        body: `${(tx.amountCents / 100).toFixed(2)} ${tx.currency} crédité sur votre wallet via ${body.payment_method ?? "Mobile Money"}.`,
        type: "PAYMENT",
      },
    });
  });

  revalidateTag(`user-${tx.userId}`);

  return NextResponse.json({ received: true, status: "PAID" });
}

// CinetPay peut aussi envoyer GET pour vérifier que le webhook est actif
export async function GET() {
  return NextResponse.json({ ok: true, webhook: "cinetpay" });
}
