import type { NextRequest } from "next/server";

export async function safeJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function redirectUrl(request: NextRequest, path: string) {
  const host = request.headers.get("host") ?? new URL(request.url).host;
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return new URL(path, `${protocol}://${host}`);
}
