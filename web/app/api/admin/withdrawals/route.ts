import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const withdrawals = await prisma.transaction.findMany({
    where: { type: "WALLET_WITHDRAWAL" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, email: true, fullName: true, phone: true } },
    },
  });

  return NextResponse.json({ withdrawals });
}

const actionSchema = z.object({
  transactionId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const parsed = actionSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const { transactionId, action, note } = parsed.data;

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });

  if (!tx || tx.type !== "WALLET_WITHDRAWAL") {
    return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
  }
  if (tx.status !== "PENDING") {
    return NextResponse.json({ error: "Transaction déjà traitée." }, { status: 409 });
  }

  const newStatus = action === "APPROVE" ? "PAID" : "FAILED";

  await prisma.$transaction(async (db) => {
    await db.transaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus,
        metadata: JSON.stringify({
          ...JSON.parse(tx.metadata ?? "{}"),
          adminAction: action,
          adminNote: note ?? "",
          processedAt: new Date().toISOString(),
          processedBy: session.userId,
        }),
      },
    });

    if (action === "REJECT") {
      await db.wallet.update({
        where: { userId: tx.userId },
        data: { balanceCents: { increment: tx.amountCents } },
      });
    }

    await db.notification.create({
      data: {
        userId: tx.userId,
        title: action === "APPROVE" ? "✅ Retrait approuvé" : "❌ Retrait refusé",
        body: action === "APPROVE"
          ? `Votre retrait de ${(tx.amountCents / 100).toFixed(2)} ${tx.currency} a été approuvé. Virement en cours.`
          : `Votre retrait de ${(tx.amountCents / 100).toFixed(2)} ${tx.currency} a été refusé${note ? ` : ${note}` : ""}. Solde recrédité.`,
        type: "PAYMENT",
      },
    });
  });

  return NextResponse.json({ ok: true, status: newStatus });
}
