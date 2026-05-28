"use client";

import { Activity, Globe2, Radio, ShieldCheck, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { money } from "@/lib/format";

type LiveEvent = {
  id: string;
  type: string;
  title: string;
  region: string;
  currency: string;
  amount: number;
  generatedAt: string;
};

type Presence = {
  onlineUsers: number;
  activeGroups: number;
  latencyMs: number;
};

const initialEvents: LiveEvent[] = [
  {
    id: "local_secure_session",
    type: "security",
    title: "Session chiffree active",
    region: "Global",
    currency: "XOF",
    amount: 0,
    generatedAt: "2026-01-01T12:00:00.000Z"
  }
];

function eventTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function LivePulse({
  userId,
  name,
  currency
}: {
  userId: string;
  name: string;
  currency: string;
}) {
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<Presence>({ onlineUsers: 24, activeGroups: 9, latencyMs: 42 });
  const [events, setEvents] = useState<LiveEvent[]>(initialEvents);

  useEffect(() => {
    const socket = io({
      path: "/api/realtime",
      transports: ["websocket", "polling"],
      reconnection: true
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join:user", { userId, name, currency });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("presence:update", (payload: Presence) => setPresence(payload));
    socket.on("server:ready", (payload: { event?: LiveEvent; metrics?: Presence }) => {
      if (payload.metrics) setPresence(payload.metrics);
      if (payload.event) setEvents((current) => [payload.event!, ...current].slice(0, 4));
    });
    socket.on("activity:new", (event: LiveEvent) => {
      setEvents((current) => [event, ...current].slice(0, 4));
    });

    const fallback = window.setInterval(async () => {
      if (socket.connected) return;
      const response = await fetch("/api/realtime/pulse").catch(() => null);
      if (!response?.ok) return;
      const payload = (await response.json()) as { event?: LiveEvent; metrics?: Presence };
      if (payload.metrics) setPresence(payload.metrics);
      if (payload.event) setEvents((current) => [payload.event!, ...current].slice(0, 4));
    }, 5000);

    return () => {
      window.clearInterval(fallback);
      socket.disconnect();
    };
  }, [currency, name, userId]);

  return (
    <div className="mb-4 glass rounded-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-gold">Reseau mondial</p>
          <p className="text-lg font-black">Operations live</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black">
          {connected ? <Wifi size={15} className="text-emerald-300" /> : <Radio size={15} className="text-gold" />}
          {connected ? "Live" : "Sync"}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/[0.08] p-3">
          <Globe2 size={16} className="mb-2 text-emerald-300" />
          <p className="text-lg font-black">{presence.onlineUsers}</p>
          <p className="text-[11px] text-smoke">membres</p>
        </div>
        <div className="rounded-2xl bg-white/[0.08] p-3">
          <Activity size={16} className="mb-2 text-gold" />
          <p className="text-lg font-black">{presence.activeGroups}</p>
          <p className="text-[11px] text-smoke">groupes</p>
        </div>
        <div className="rounded-2xl bg-white/[0.08] p-3">
          <ShieldCheck size={16} className="mb-2 text-emerald-300" />
          <p className="text-lg font-black">{presence.latencyMs}ms</p>
          <p className="text-[11px] text-smoke">latence</p>
        </div>
      </div>

      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-2 light:bg-white/60">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{event.title}</p>
              <p className="text-xs text-smoke">
                {event.region} - {eventTime(event.generatedAt)}
              </p>
            </div>
            <p className="shrink-0 text-xs font-black text-emerald-300">{event.amount > 0 ? money(event.amount, event.currency) : event.currency}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
