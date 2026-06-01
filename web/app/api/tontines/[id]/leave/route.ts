import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { processMemberLeave } from "@/lib/defaults";
import { safeJson } from "@/lib/request";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const body = await safeJson(request) as { reason?: string } | null;
  const result = await processMemberLeave(session.userId, id, body?.reason);
  if ("blocked" in result) return NextResponse.json({ error: result.blocked }, { status: 403 });
  if (!result.ok) return NextResponse.json({ error: result.message, debtCents: result.debtCents }, { status: 402 });
  return NextResponse.json({ ok: true, message: result.message });
}
