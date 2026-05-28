import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  const dashboard = await getUserDashboard(session.userId);
  return NextResponse.json(dashboard);
}
