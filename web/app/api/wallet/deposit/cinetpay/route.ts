import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { initCinetPayPayment, isCinetPayConfigured } from "@/lib/cinetpay";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { amountCents, phoneNumber } = body ?? {};

  if (!amountCents || typeof amountCents !== "number" || amountCents < 100) {
    return NextResponse.json({ error: "Montant invalide (minimum 1 €/1 FCFA)." }, { status: 400 });
  }

  if (!isCinetPayConfigured()) {
    return NextResponse.json({
      error: "Mobile Money non configuré. Ajoutez CINETPAY_API_KEY et CINETPAY_SITE_ID dans les variables d'environnement.",
      setup: "https://cinetpay.com/s/settings#tabApiKey",
    }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { wallet: true },
  });
  if (!user?.wallet) return NextResponse.json({ error: "Wallet introuvable." }, { status: 404 });

  const transactionId = `KTZ-MM-${session.userId.slice(-6)}-${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app";

  // Créer la transaction PENDING en base
  const tx = await prisma.transaction.create({
    data: {
      userId: session.userId,
      walletId: user.wallet.id,
      type: "WALLET_DEPOSIT",
      status: "PENDING",
      amountCents,
      currency: user.wallet.currency,
      provider: "CINETPAY",
      reference: transactionId,
      metadata: JSON.stringify({ mode: "cinetpay_mobile_money", phoneNumber: phoneNumber ?? "" }),
    },
  });

  const result = await initCinetPayPayment({
    transactionId,
    amountCents,
    currency: user.wallet.currency,
    description: `Recharge Wallet Kotizy — ${(amountCents / 100).toFixed(2)} ${user.wallet.currency}`,
    returnUrl: `${appUrl}/wallet?cinetpay=success&txId=${tx.id}`,
    notifyUrl: `${appUrl}/api/webhooks/cinetpay`,
    customerName: user.fullName.split(" ")[0] ?? "Client",
    customerSurname: user.fullName.split(" ").slice(1).join(" ") || "Kotizy",
    customerEmail: user.email,
    customerPhone: phoneNumber ?? user.phone ?? "",
    metadata: JSON.stringify({ transactionId: tx.id, userId: session.userId, walletId: user.wallet.id }),
  });

  if (!result.ok) {
    await prisma.transaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    paymentUrl: result.paymentUrl,
    transactionId: tx.id,
    provider: "CINETPAY",
  });
}
