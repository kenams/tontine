import "server-only";

import crypto from "crypto";

const DEFAULT_SECRET = "local-dev-secret-change-before-production";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const sessionCookieName = "tontine_session";

export type Session = {
  userId: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  status: string;
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SECRET || DEFAULT_SECRET;
  if (process.env.NODE_ENV === "production" && value === DEFAULT_SECRET) {
    throw new Error("[Kotizy] AUTH_SECRET manquant ou non changé en production.");
  }
  return value;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(session: Omit<Session, "exp">) {
  const payload = base64Url(
    JSON.stringify({
      ...session,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string | null): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(sessionCookieName)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, fullName: true, role: true, status: true }
  });
  if (!user || user.status === "BANNED" || user.status === "SUSPENDED") return null;

  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    status: user.status,
    exp: session.exp
  };
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
}

export function getSessionFromRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(sessionCookieName)?.value);
}
