import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { getTontineDetail } from "@/lib/data";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const { id } = await params;
  const detail = await getTontineDetail(id, session.userId);
  if (!detail.isMember && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }
  return NextResponse.json(detail);
}
