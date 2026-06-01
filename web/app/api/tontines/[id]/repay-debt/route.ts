import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { repayDebt } from "@/lib/defaults";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const result = await repayDebt(session.userId, id);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 402 });
  return NextResponse.json({ ok: true, message: result.message });
}
