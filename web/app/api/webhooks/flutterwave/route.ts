import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyFlwWebhookSignature, verifyFlutterwaveTransaction } from "@/lib/flutterwave";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("verif-hash") ?? "";
  const rawBody = await request.text();

  if (!verifyFlwWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let event: { event: string; data?: { tx_ref?: string; id?: number; status?: string } };
  try { event = JSON.parse(rawBody); } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  if (event.event !== "charge.completed" || !event.data?.tx_ref || !event.data?.id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { tx_ref, id: transactionId, status } = event.data;
  if (status !== "successful") {
    await prisma.transaction.updateMany({ where: { reference: tx_ref, status: "PENDING" }, data: { status: "FAILED" } });
    return NextResponse.json({ ok: true });
  }

  const pending = await prisma.transaction.findFirst({
    where: { reference: tx_ref, status: "PENDING" },
  });
  if (!pending || !pending.walletId) return NextResponse.json({ ok: true, skipped: "no_pending" });

  // Double-vérification côté API Flutterwave
  const verification = await verifyFlutterwaveTransaction(String(transactionId));
  if (!verification.ok || verification.status !== "successful") {
    return NextResponse.json({ ok: true, skipped: "verification_failed" });
  }

  await prisma.$transaction([
    prisma.wallet.update({ where: { id: pending.walletId }, data: { balanceCents: { increment: pending.amountCents } } }),
    prisma.transaction.update({ where: { id: pending.id }, data: { status: "PAID" } }),
    prisma.notification.create({
      data: {
        userId: pending.userId,
        title: "💚 Mobile Money reçu",
        body: `${(pending.amountCents / 100).toLocaleString("fr-FR")} ${pending.currency} crédités sur votre wallet.`,
        type: "WALLET_DEPOSIT",
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
