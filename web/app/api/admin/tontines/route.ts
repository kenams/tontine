import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeUserSelect } from "@/lib/select";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const tontines = await prisma.tontineGroup.findMany({
    include: {
      emergencyFund: true,
      memberships: { include: { user: { select: safeUserSelect } } },
      contributions: true
    },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ tontines });
}
