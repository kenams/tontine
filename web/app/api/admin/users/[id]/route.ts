import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { auditLog, clientIp } from "@/lib/security";
import { adminUserStatusSchema } from "@/lib/validators";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      trustScore: true,
      memberships: { include: { tontineGroup: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });
  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const { id } = await params;
  const parsed = adminUserStatusSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });

  const user = await prisma.user.update({ where: { id }, data: { status: parsed.data.status } });
  await auditLog({
    actorId: session.userId,
    action: "USER_STATUS_UPDATED",
    targetType: "User",
    targetId: id,
    ipAddress: clientIp(request),
    metadata: { status: parsed.data.status }
  });
  return NextResponse.json({ user });
}
