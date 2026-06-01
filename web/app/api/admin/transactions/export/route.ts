import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/security";
import { safeUserSelect } from "@/lib/select";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const transactions = await prisma.transaction.findMany({ include: { user: { select: safeUserSelect }, tontineGroup: true }, orderBy: { createdAt: "desc" } });
  const rows = [
    ["reference", "date", "user", "email", "group", "type", "status", "provider", "amount_minor", "currency", "risk_score"],
    ...transactions.map((tx) => [
      tx.reference,
      tx.createdAt.toISOString(),
      tx.user.fullName,
      tx.user.email,
      tx.tontineGroup?.name ?? "",
      tx.type,
      tx.status,
      tx.provider,
      String(tx.amountCents),
      tx.currency,
      String(tx.riskScore)
    ])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  await auditLog({
    actorId: session.userId,
    action: "EXPORT_TRANSACTIONS",
    targetType: "Transaction",
    targetId: "all",
    metadata: { count: transactions.length }
  });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=tontine-transactions.csv"
    }
  });
}
