import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initCinetpayPayment, isCinetpayConfigured } from "@/lib/cinetpay";
import { rateLimit, clientIp } from "@/lib/security";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app";

export async function POST(request: NextRequest) {
  const session = await requireUser();
  const limit = await rateLimit(request, "cinetpay-deposit", 5, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });

  if (!isCinetpayConfigured()) {
    return NextResponse.json({ error: "Mobile Money CinetPay temporairement indisponible." }, { status: 503 });
  }

  let amountCents: number;
  let currency: string;
  try {
    const body = await request.json() as { amountCents?: number; currency?: string };
    amountCents = Number(body.amountCents);
    currency = String(body.currency ?? "XOF").toUpperCase();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (!Number.isInteger(amountCents) || amountCents < 30000 || amountCents > 200_000_000) {
    return NextResponse.json({ error: "Montant invalide (min 300 XOF, max 2 000 000 XOF)." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, fullName: true, phone: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const wallet = await prisma.wallet.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, balanceCents: 0, currency, status: "ACTIVE" },
    update: {},
  });

  // max 30 chars pour merchant_transaction_id
  const txRef = `CP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`.slice(0, 30);
  const nameParts = (user.fullName ?? "Utilisateur Kotizy").split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || firstName;

  await prisma.transaction.create({
    data: {
      userId: session.userId,
      walletId: wallet.id,
      type: "WALLET_DEPOSIT",
      status: "PENDING",
      amountCents,
      currency,
      provider: "CINETPAY",
      reference: txRef,
      riskScore: 10,
      metadata: JSON.stringify({ provider: "cinetpay", ip: clientIp(request) }),
    },
  });

  const result = await initCinetpayPayment({
    txRef,
    amountCents,
    currency,
    clientFirstName: firstName,
    clientLastName: lastName,
    clientEmail: user.email,
    clientPhone: user.phone ?? undefined,
    notifyUrl: `${APP_URL}/api/webhooks/cinetpay`,
    successUrl: `${APP_URL}/wallet/deposit/cinetpay/verify?tx_ref=${txRef}&status=success`,
    failedUrl: `${APP_URL}/wallet/deposit/cinetpay/verify?tx_ref=${txRef}&status=failed`,
    description: `Recharge wallet Kotizy — ${user.fullName}`,
  });

  if (!result.ok) {
    await prisma.transaction.updateMany({ where: { reference: txRef }, data: { status: "FAILED" } });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Stocker le notify_token pour validation webhook ultérieure
  if (result.notifyToken) {
    await prisma.transaction.updateMany({
      where: { reference: txRef },
      data: { metadata: JSON.stringify({ provider: "cinetpay", ip: clientIp(request), notifyToken: result.notifyToken }) },
    });
  }

  return NextResponse.json({ ok: true, paymentUrl: result.paymentUrl, txRef, mustRedirect: result.mustRedirect });
}
