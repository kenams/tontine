import { NextResponse } from "next/server";

import { realtimeActivity, realtimeMetrics } from "@/lib/realtime-demo";

export async function GET() {
  return NextResponse.json({
    mode: "polling-fallback",
    metrics: realtimeMetrics(),
    event: realtimeActivity()
  });
}
