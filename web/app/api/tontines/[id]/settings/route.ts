import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/request";
import { updateGroupSettingsSchema } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const group = await prisma.tontineGroup.findUnique({ where: { id }, select: { createdById: true } });
  if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });

  const isAdmin = group.createdById === session.userId || session.role === "ADMIN";
  if (!isAdmin) return NextResponse.json({ error: "Permission refusée." }, { status: 403 });

  const parsed = updateGroupSettingsSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const updated = await prisma.tontineGroup.update({
    where: { id },
    data: parsed.data as never,
  });

  return NextResponse.json({ ok: true, group: updated });
}
