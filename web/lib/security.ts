import "server-only";

import type { NextRequest } from "next/server";

import { prisma } from "@/lib/db";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export function rateLimit(request: NextRequest, key: string, limit = 20, windowMs = 60_000) {
  const bucketKey = `${clientIp(request)}:${key}`;
  const current = buckets.get(bucketKey);
  const now = Date.now();
  if (!current || current.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
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
