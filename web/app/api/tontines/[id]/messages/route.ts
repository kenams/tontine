import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { messageSchema } from "@/lib/validators";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const { id } = await params;

  const membership = await prisma.membership.findFirst({ where: { userId: session.userId, tontineGroupId: id } });
  if (!membership && session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });

  const url = new URL(_request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { tontineGroupId: id },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    }),
    prisma.message.count({ where: { tontineGroupId: id } }),
  ]);

  const mapped = messages.map((m) => ({
    id: m.id,
    tontineId: m.tontineGroupId,
    senderId: m.userId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    sender: m.user,
  }));

  return NextResponse.json({
    messages: mapped,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

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
