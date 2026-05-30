import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function prepareEphemeralSqlite() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("file:/tmp/")) return;
  const target = url.replace("file:", "");
  if (fs.existsSync(target)) return;
  const sourceCandidates = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), ".next", "server", "prisma", "dev.db"),
    path.join(process.cwd(), ".next", "standalone", "prisma", "dev.db")
  ];
  const source = sourceCandidates.find((c) => fs.existsSync(c));
  if (!source) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

prepareEphemeralSqlite();

function makePrisma() {
  const url = process.env.DATABASE_URL ?? "";
  // Supabase + Vercel serverless: force pgbouncer compatibility + connexion unique
  const optimizedUrl =
    url && !url.startsWith("file:") && !url.includes("pgbouncer")
      ? url + (url.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=1"
      : url;

  return new PrismaClient({
    datasourceUrl: optimizedUrl || undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
