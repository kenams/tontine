import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { auditLog, clientIp } from "@/lib/security";
import { inviteSchema } from "@/lib/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const { id } = await params;
  const parsed = inviteSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Email invalide." }, { status: 400 });

  const membership = await prisma.membership.findFirst({ where: { userId: session.userId, tontineGroupId: id } });
  if (!membership && session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });

  await prisma.notification.create({
    data: {
      userId: session.userId,
      tontineGroupId: id,
      title: "Invitation preparee",
      body: `Invitation test envoyee a ${parsed.data.email}.`,
      type: "INVITE"
    }
  });
  await auditLog({
    actorId: session.userId,
    action: "MEMBER_INVITED",
    targetType: "TontineGroup",
    targetId: id,
    ipAddress: clientIp(request),
    metadata: { email: parsed.data.email }
  });

  return NextResponse.json({ ok: true });
}
