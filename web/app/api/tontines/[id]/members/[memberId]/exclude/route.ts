import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { excludeMember } from "@/lib/defaults";
import { safeJson } from "@/lib/request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await requireUser();
  const { memberId } = await params;
  const body = await safeJson(request) as { reason?: string } | null;
  const result = await excludeMember(session.userId, memberId, body?.reason);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 403 });
  return NextResponse.json({ ok: true, message: result.message, debtCents: result.debtCents });
}
