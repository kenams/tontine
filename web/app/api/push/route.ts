import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(10),
  auth: z.string().min(4),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const parsed = subscribeSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Subscription invalide." }, { status: 400 });

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: { userId: session.userId, ...parsed.data },
    update: { userId: session.userId, p256dh: parsed.data.p256dh, auth: parsed.data.auth },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await safeJson(request);
  const endpoint = (body as { endpoint?: string } | null)?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "Endpoint requis." }, { status: 400 });

  await prisma.pushSubscription.deleteMany({
    where: { userId: session.userId, endpoint },
  });

  return NextResponse.json({ ok: true });
}
