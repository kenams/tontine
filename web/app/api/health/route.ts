import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "kotizy", db: "up", ts: Date.now() });
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);
    return NextResponse.json({ ok: false, service: "kotizy", db: "down", err: msg, ts: Date.now() }, { status: 503 });
  }
}
