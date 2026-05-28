import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeSearch } from "@/lib/security";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const search = sanitizeSearch(request.nextUrl.searchParams.get("q"));
  const status = sanitizeSearch(request.nextUrl.searchParams.get("status"));
  const transactions = await prisma.transaction.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search } },
              { provider: { contains: search } },
              { user: { email: { contains: search } } },
              { user: { fullName: { contains: search } } }
            ]
          }
        : {})
    },
    include: { user: true, tontineGroup: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ transactions });
}
