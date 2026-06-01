import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const org = await (prisma.organization as never).findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true, trustScore: true } } },
      },
      tontines: {
        include: {
          tontineGroup: {
            select: { id: true, name: true, contributionCents: true, currency: true, status: true, memberships: { select: { id: true } } },
          },
        },
      },
    },
  }) as {
    id: string; name: string; type: string; slug: string; ownerId: string;
    revenueShareBps: number; totalVolumeCents: number; totalEarnedCents: number;
    members: { userId: string; role: string; user: { id: string; fullName: string; email: string; avatarUrl: string | null } }[];
    tontines: { tontineGroup: { id: string; name: string; contributionCents: number; currency: string; status: string; memberships: { id: string }[] } }[];
  } | null;

  if (!org) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });

  const isMember = org.members.some(m => m.userId === session.userId);
  if (!isMember && session.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  return NextResponse.json({ org });
}

// Lier une tontine à l'organisation
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const org = await (prisma.organization as never).findUnique({ where: { id } }) as { id: string; ownerId: string } | null;
  if (!org) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
  if (org.ownerId !== session.userId && session.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = await request.json() as { tontineGroupId?: string; userId?: string; action?: string };

  if (body.action === "add_tontine" && body.tontineGroupId) {
    await (prisma.orgTontine as never).upsert({
      where: { tontineGroupId: body.tontineGroupId },
      create: { id: `ot-${Date.now()}`, orgId: id, tontineGroupId: body.tontineGroupId },
      update: {},
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "add_member" && body.userId) {
    await (prisma.orgMember as never).upsert({
      where: { orgId_userId: { orgId: id, userId: body.userId } },
      create: { id: `om-${Date.now()}`, orgId: id, userId: body.userId, role: "MEMBER" },
      update: {},
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
