import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeSearch } from "@/lib/security";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const search = sanitizeSearch(request.nextUrl.searchParams.get("q"));
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } }
          ]
        }
      : undefined,
    include: { wallet: { select: { balanceCents: true, currency: true, status: true } }, trustScore: true, memberships: { select: { id: true, status: true, tontineGroupId: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ users });
}
