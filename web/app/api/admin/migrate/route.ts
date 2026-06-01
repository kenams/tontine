import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const results: string[] = [];
  const run = async (label: string, sql: string) => {
    try { await prisma.$executeRawUnsafe(sql); results.push(`OK: ${label}`); }
    catch (e) { results.push(`SKIP: ${label} — ${(e as Error).message.slice(0, 80)}`); }
  };

  await run("CREATE Organization", `CREATE TABLE IF NOT EXISTS tontineapp."Organization" (
    id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'ASSOCIATION',
    "ownerId" TEXT NOT NULL, "revenueShareBps" INTEGER NOT NULL DEFAULT 25,
    status TEXT NOT NULL DEFAULT 'ACTIVE', "logoUrl" TEXT, website TEXT, description TEXT,
    "totalVolumeCents" INTEGER NOT NULL DEFAULT 0, "totalEarnedCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY (id)
  )`);
  await run("idx Organization.slug", `CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON tontineapp."Organization"(slug)`);
  await run("idx Organization.ownerId", `CREATE INDEX IF NOT EXISTS "Organization_ownerId_idx" ON tontineapp."Organization"("ownerId")`);
  await run("idx Organization.status", `CREATE INDEX IF NOT EXISTS "Organization_status_idx" ON tontineapp."Organization"(status)`);

  await run("CREATE OrgMember", `CREATE TABLE IF NOT EXISTS tontineapp."OrgMember" (
    id TEXT NOT NULL, "orgId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER', "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgMember_pkey" PRIMARY KEY (id)
  )`);
  await run("idx OrgMember.unique", `CREATE UNIQUE INDEX IF NOT EXISTS "OrgMember_orgId_userId_key" ON tontineapp."OrgMember"("orgId","userId")`);
  await run("idx OrgMember.userId", `CREATE INDEX IF NOT EXISTS "OrgMember_userId_idx" ON tontineapp."OrgMember"("userId")`);

  await run("CREATE OrgTontine", `CREATE TABLE IF NOT EXISTS tontineapp."OrgTontine" (
    id TEXT NOT NULL, "orgId" TEXT NOT NULL, "tontineGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgTontine_pkey" PRIMARY KEY (id)
  )`);
  await run("idx OrgTontine.tontineGroupId", `CREATE UNIQUE INDEX IF NOT EXISTS "OrgTontine_tontineGroupId_key" ON tontineapp."OrgTontine"("tontineGroupId")`);
  await run("idx OrgTontine.orgId", `CREATE INDEX IF NOT EXISTS "OrgTontine_orgId_idx" ON tontineapp."OrgTontine"("orgId")`);

  return NextResponse.json({ ok: true, results });
}
