import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeSearch } from "@/lib/security";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currency = sanitizeSearch(searchParams.get("currency"));
  const minContrib = Number(searchParams.get("minContrib") ?? 0);
  const maxContrib = Number(searchParams.get("maxContrib") ?? 999_999_999);

  const tontines = await prisma.tontineGroup.findMany({
    where: {
      isPublic: true,
      status: "ACTIVE",
      ...(currency ? { currency } : {}),
      contributionCents: {
        gte: minContrib * 100 || 0,
        lte: maxContrib * 100 || 999_999_999,
      },
    },
    select: {
      id: true, name: true, description: true, contributionCents: true,
      currency: true, frequency: true, maxMembers: true, nextDueAt: true,
      currentRound: true, minTrustScore: true, collateralRounds: true,
      joinCode: true, createdAt: true,
      memberships: { where: { status: { in: ["ACTIVE", "LATE"] } }, select: { id: true } },
      createdBy: { select: { fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  } as never) as Array<{
    id: string; name: string; description: string; contributionCents: number;
    currency: string; frequency: string; maxMembers: number; nextDueAt: Date;
    currentRound: number; minTrustScore: number; collateralRounds: number;
    joinCode: string; createdAt: Date;
    memberships: { id: string }[];
    createdBy: { fullName: string; avatarUrl: string | null };
  }>;

  return NextResponse.json({
    tontines: tontines.map(t => ({
      ...t,
      memberCount: t.memberships.length,
      spotsLeft: t.maxMembers - t.memberships.length,
      memberships: undefined,
    })),
  });
}
