import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scoreFraudRisk } from "@/lib/fraud";

const fraudRequestSchema = z.object({
  userId: z.string().optional(),
  amountCents: z.number().int().positive().default(25_000),
  currency: z.string().min(3).max(3).default("XOF"),
  provider: z.string().default("WALLET"),
  crossBorder: z.boolean().default(false),
  newDevice: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const parsed = fraudRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide.", details: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;
  const targetUserId = session.role === "ADMIN" && payload.userId ? payload.userId : session.userId;

  const [user, failedTransactions, pendingTransactions, velocityCount, lateMemberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: targetUserId },
      include: { trustScore: true }
    }),
    prisma.transaction.count({ where: { userId: targetUserId, status: "FAILED" } }),
    prisma.transaction.count({ where: { userId: targetUserId, status: "PENDING" } }),
    prisma.transaction.count({
      where: {
        userId: targetUserId,
        createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) }
      }
    }),
    prisma.membership.count({ where: { userId: targetUserId, status: "LATE" } })
  ]);

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const result = scoreFraudRisk({
    amountCents: payload.amountCents,
    currency: payload.currency,
    provider: payload.provider,
    trustScore: user.trustScore?.score,
    failedTransactions,
    pendingTransactions,
    velocityCount,
    lateMemberships,
    crossBorder: payload.crossBorder,
    newDevice: payload.newDevice
  });

  return NextResponse.json({
    mode: process.env.OPENAI_API_KEY ? "openai-ready" : "local-rules",
    userId: targetUserId,
    provider: payload.provider,
    currency: payload.currency,
    ...result
  });
}
