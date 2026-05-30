import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Payload invalide." }, { status: 400 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, tontineGroupId: id },
  });
  if (!membership) return NextResponse.json({ error: "Vous n'êtes pas membre de ce groupe." }, { status: 403 });

  await prisma.membership.update({
    where: { id: membership.id },
    data: { autoPayEnabled: parsed.data.enabled },
  });

  return NextResponse.json({ ok: true, autoPayEnabled: parsed.data.enabled });
}
