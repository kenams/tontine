import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Mobile Money providers — intégration à brancher avec les clés API
// Wave: https://wave.com/api | Orange Money: https://developer.orange.com | MTN MoMo: https://momodeveloper.mtn.com
const PROVIDERS = ["WAVE", "ORANGE_MONEY", "MTN_MOMO"] as const;
type MobileMoneyProvider = typeof PROVIDERS[number];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { provider, phoneNumber, amountCents } = body ?? {};

  if (!provider || !PROVIDERS.includes(provider as MobileMoneyProvider)) {
    return NextResponse.json({ error: "Provider invalide. Acceptés : WAVE, ORANGE_MONEY, MTN_MOMO" }, { status: 400 });
  }
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });
  }
  if (!amountCents || typeof amountCents !== "number" || amountCents < 100) {
    return NextResponse.json({ error: "Montant invalide (minimum 100 centimes)." }, { status: 400 });
  }

  // TODO: Brancher les APIs réelles
  // Wave: POST https://api.wave.com/v1/checkout/sessions
  // Orange Money: POST https://api.orange.com/orange-money-webpay/dev/v1/webpayment
  // MTN MoMo: POST https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay

  // Placeholder — crée une transaction PENDING en attendant l'intégration
  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) return NextResponse.json({ error: "Wallet introuvable." }, { status: 404 });

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.userId,
      walletId: wallet.id,
      type: "WALLET_DEPOSIT",
      status: "PENDING",
      amountCents,
      currency: wallet.currency,
      provider: provider as string,
      reference: `MM-${provider}-${session.userId}-${Date.now()}`,
      metadata: JSON.stringify({ mode: "mobile_money", provider, phoneNumber: phoneNumber.slice(-4).padStart(phoneNumber.length, "*") }),
    },
  });

  return NextResponse.json({
    ok: true,
    status: "PENDING",
    transactionId: transaction.id,
    message: `Dépôt ${provider} en attente. Confirmez le paiement sur votre téléphone.`,
    // redirectUrl sera fourni par l'API du provider une fois intégré
  });
}
