import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await requireUser();
  const { dataUrl } = await request.json() as { dataUrl?: string };

  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Image invalide." }, { status: 400 });
  }
  // Limite ~200KB base64 (150KB image ~= 200KB base64)
  if (dataUrl.length > 220_000) {
    return NextResponse.json({ error: "Image trop volumineuse (max 150KB)." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl: dataUrl },
  });

  return NextResponse.json({ ok: true, avatarUrl: dataUrl });
}

export async function DELETE(request: NextRequest) {
  const session = await requireUser();
  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl: null },
  });
  return NextResponse.json({ ok: true });
}
