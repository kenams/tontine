import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const tx = await prisma.transaction.findFirst({
    where: { id, userId: session.userId, status: "PENDING" },
  });
  if (!tx) return NextResponse.json({ error: "Transaction introuvable ou déjà traitée." }, { status: 404 });

  await prisma.transaction.update({ where: { id }, data: { status: "FAILED" } });
  return NextResponse.json({ ok: true });
}
