import fs from "node:fs";
import path from "node:path";
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
  const source = sourceCandidates.find((candidate) => fs.existsSync(candidate));
  if (!source) return;

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

prepareEphemeralSqlite();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
