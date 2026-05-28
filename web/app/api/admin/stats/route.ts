import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getCachedAdminStats } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  return NextResponse.json(await getCachedAdminStats());
}
