import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    include: { tontineGroup: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ transactions });
}
