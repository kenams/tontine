import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { kycStatus: true, kycVerifiedAt: true },
  });

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  return NextResponse.json({ kycStatus: user.kycStatus, kycVerifiedAt: user.kycVerifiedAt });
}
