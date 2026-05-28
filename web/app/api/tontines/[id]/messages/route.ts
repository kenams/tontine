import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { messageSchema } from "@/lib/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const { id } = await params;
  const parsed = messageSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Message invalide." }, { status: 400 });

  const membership = await prisma.membership.findFirst({ where: { userId: session.userId, tontineGroupId: id } });
  if (!membership && session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });

  const message = await prisma.message.create({
    data: {
      userId: session.userId,
      tontineGroupId: id,
      content: parsed.data.content
    }
  });
  return NextResponse.json({ message }, { status: 201 });
}
