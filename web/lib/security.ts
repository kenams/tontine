import "server-only";

import type { NextRequest } from "next/server";

import { prisma } from "@/lib/db";

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function rateLimit(request: NextRequest, key: string, limit = 20, windowMs = 60_000) {
  const bucketKey = `${clientIp(request)}:${key}`;
  const windowStart = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitBucket.count({
    where: { key: bucketKey, createdAt: { gte: windowStart } }
  });
  if (count >= limit) return { ok: false, remaining: 0 };
  await prisma.rateLimitBucket.create({ data: { key: bucketKey } });
  // Cleanup seulement 5% du temps — évite une 2e query sur chaque request
  if (Math.random() < 0.05) {
    void prisma.rateLimitBucket.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - windowMs * 10) } } });
  }
  return { ok: true, remaining: limit - count - 1 };
}

export async function auditLog(input: {
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.adminLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      ipAddress: input.ipAddress,
      metadata: JSON.stringify(input.metadata ?? {})
    }
  });
}

export function sanitizeSearch(value: string | null) {
  return (value ?? "").trim().slice(0, 80);
}
