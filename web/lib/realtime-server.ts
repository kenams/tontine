import "server-only";

export type RealtimeEvent = {
  id: string;
  type: string;
  title: string;
  region: string;
  currency: string;
  amount: number;
  generatedAt: string;
  room?: string;
};

export async function emitEvent(event: Omit<RealtimeEvent, "id" | "generatedAt">) {
  if (process.env.NODE_ENV !== "development") return;
  const payload: RealtimeEvent = {
    ...event,
    id: `real_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    generatedAt: new Date().toISOString()
  };
  try {
    await fetch("http://localhost:3021/__emit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    // dev-server non lancé — silent fail
  }
}
