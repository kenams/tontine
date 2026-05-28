import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  const logs = await prisma.adminLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ logs });
}
