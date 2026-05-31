import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";

const schema = z.object({
  token: z.string().min(10).startsWith("ExponentPushToken["),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const parsed = schema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Token invalide." }, { status: 400 });

  await prisma.expoPushToken.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, token: parsed.data.token },
    update: { token: parsed.data.token, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  await prisma.expoPushToken.deleteMany({ where: { userId: session.userId } });
  return NextResponse.json({ ok: true });
}
