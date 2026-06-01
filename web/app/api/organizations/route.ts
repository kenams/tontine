import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit, auditLog, clientIp } from "@/lib/security";
import { z } from "zod";
import { safeJson } from "@/lib/request";

const createOrgSchema = z.object({
  name: z.string().min(3).max(80),
  type: z.enum(["ASSOCIATION", "CHURCH", "MOSQUE", "COMPANY", "COMMUNITY"]),
  description: z.string().max(300).optional(),
  website: z.string().url().optional().or(z.literal("")),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 42);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const orgs = await (prisma.organization as never).findMany({
    where: {
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    include: {
      members: { select: { id: true } },
      tontines: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  }) as Array<{ id: string; name: string; type: string; slug: string; revenueShareBps: number; totalEarnedCents: number; ownerId: string; members: { id: string }[]; tontines: { id: string }[] }>;

  return NextResponse.json({ organizations: orgs });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const limit = await rateLimit(request, "create-org", 5, 3_600_000);
  if (!limit.ok) return NextResponse.json({ error: "Limite atteinte." }, { status: 429 });

  const parsed = createOrgSchema.safeParse(await safeJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const org = await (prisma.organization as never).create({
    data: {
      id: `org-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: parsed.data.name,
      slug,
      type: parsed.data.type,
      description: parsed.data.description ?? "",
      website: parsed.data.website ?? "",
      ownerId: session.userId,
      revenueShareBps: 25,
      members: {
        create: {
          id: `om-${Date.now()}`,
          userId: session.userId,
          role: "OWNER",
        },
      },
    },
  });

  await auditLog({ actorId: session.userId, action: "ORG_CREATED", targetType: "Organization", targetId: (org as { id: string }).id, ipAddress: clientIp(request) });

  // Badge super-organisateur
  void awardOrgBadge(session.userId);

  return NextResponse.json({ org }, { status: 201 });
}

async function awardOrgBadge(userId: string) {
  try {
    const badge = await prisma.badge.upsert({
      where: { code: "organizer" },
      create: { id: `badge-org-${Date.now()}`, code: "organizer", name: "Super-Organisateur", description: "A créé une organisation partenaire Kotizy", color: "blue" },
      update: {},
    });
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { id: `ub-org-${Date.now()}`, userId, badgeId: badge.id },
      update: {},
    });
  } catch { /* badge exists */ }
}
