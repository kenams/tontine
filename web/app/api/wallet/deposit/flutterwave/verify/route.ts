import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave";

export async function GET(request: NextRequest) {
  const session = await requireUser();
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transaction_id");
  const txRef = searchParams.get("tx_ref");

  if (!transactionId || !txRef) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  // Vérifier que la transaction appartient bien à cet utilisateur
  const pending = await prisma.transaction.findFirst({
    where: { reference: txRef, userId: session.userId, status: "PENDING" },
  });
  if (!pending) {
    return NextResponse.json({ error: "Transaction introuvable ou déjà traitée." }, { status: 404 });
  }

  const verification = await verifyFlutterwaveTransaction(transactionId);
  if (!verification.ok || verification.status !== "successful") {
    await prisma.transaction.update({ where: { id: pending.id }, data: { status: "FAILED" } });
    return NextResponse.json({ ok: false, status: verification.status ?? "failed" });
  }

  // Créditer le wallet
  const wallet = pending.walletId
    ? await prisma.wallet.findUnique({ where: { id: pending.walletId } })
    : null;

  if (!wallet) return NextResponse.json({ error: "Wallet introuvable." }, { status: 404 });

  const alreadyPaid = await prisma.transaction.findFirst({
    where: { reference: txRef, status: "PAID" },
  });
  if (alreadyPaid) return NextResponse.json({ ok: true, alreadyCredited: true });

  await prisma.$transaction([
    prisma.wallet.update({ where: { id: wallet.id }, data: { balanceCents: { increment: pending.amountCents } } }),
    prisma.transaction.update({ where: { id: pending.id }, data: { status: "PAID", provider: "FLUTTERWAVE" } }),
    prisma.notification.create({
      data: {
        userId: session.userId,
        title: "💚 Recharge Mobile Money confirmée",
        body: `${(pending.amountCents / 100).toLocaleString("fr-FR")} ${pending.currency} crédités sur votre wallet Kotizy.`,
        type: "WALLET_DEPOSIT",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, amountCents: pending.amountCents, currency: pending.currency });
}
