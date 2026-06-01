import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initFlutterwavePayment, isFlutterwaveConfigured } from "@/lib/flutterwave";
import { rateLimit, clientIp } from "@/lib/security";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app";

export async function POST(request: NextRequest) {
  const session = await requireUser();
  const limit = await rateLimit(request, "flw-deposit", 5, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });

  if (!isFlutterwaveConfigured()) {
    return NextResponse.json({ error: "Mobile Money temporairement indisponible." }, { status: 503 });
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

  if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 500_000_00) {
    return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
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

  const txRef = `FLW-DEP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  await prisma.transaction.create({
    data: {
      userId: session.userId,
      walletId: wallet.id,
      type: "WALLET_DEPOSIT",
      status: "PENDING",
      amountCents,
      currency,
      provider: "FLUTTERWAVE",
      reference: txRef,
      riskScore: 10,
      metadata: JSON.stringify({ provider: "flutterwave", ip: clientIp(request) }),
    },
  });

  const result = await initFlutterwavePayment({
    txRef,
    amountCents,
    currency,
    customerEmail: user.email,
    customerName: user.fullName,
    customerPhone: user.phone ?? undefined,
    redirectUrl: `${APP_URL}/wallet/deposit/mobile-money?tx_ref=${txRef}`,
    description: `Recharge wallet Kotizy — ${user.fullName}`,
    meta: { userId: session.userId, walletId: wallet.id },
  });

  if (!result.ok) {
    await prisma.transaction.updateMany({ where: { reference: txRef }, data: { status: "FAILED" } });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, paymentLink: result.paymentLink, txRef });
}
