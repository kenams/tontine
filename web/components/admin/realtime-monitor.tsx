"use client";

import { Activity, AlertTriangle, Gauge, RadioTower, ShieldCheck, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { money } from "@/lib/format";

type Metrics = {
  onlineUsers: number;
  onlineAdmins: number;
  paymentsPerMinute: number;
  fraudRiskAverage: number;
  pendingPayments: number;
  failedPayments: number;
  activeGroups: number;
  latencyMs: number;
  generatedAt?: string;
};

type LiveEvent = {
  id: string;
  type: string;
  title: string;
  region: string;
  currency: string;
  amount: number;
  generatedAt: string;
};

const fallbackEvent: LiveEvent = {
  id: "admin_boot",
  type: "system",
  title: "Monitoring temps reel initialise",
  region: "Global",
  currency: "XOF",
  amount: 0,
  generatedAt: "2026-01-01T12:00:00.000Z"
};

function eventTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

export function RealtimeMonitor({
  initialMetrics,
  compact = false
}: {
  initialMetrics: Metrics;
  compact?: boolean;
}) {
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [events, setEvents] = useState<LiveEvent[]>([fallbackEvent]);

  useEffect(() => {
    const socket = io({
      path: "/api/realtime",
      transports: ["websocket", "polling"],
      reconnection: true
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join:admin");
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("metrics:update", (payload: Metrics) => setMetrics((current) => ({ ...current, ...payload })));
    socket.on("server:ready", (payload: { event?: LiveEvent; metrics?: Metrics }) => {
      if (payload.metrics) setMetrics((current) => ({ ...current, ...payload.metrics }));
      if (payload.event) setEvents((current) => [payload.event!, ...current].slice(0, compact ? 4 : 8));
    });
    socket.on("activity:new", (event: LiveEvent) => {
      setEvents((current) => [event, ...current].slice(0, compact ? 4 : 8));
    });

    const fallback = window.setInterval(async () => {
      if (socket.connected) return;
      const response = await fetch("/api/realtime/pulse").catch(() => null);
      if (!response?.ok) return;
      const payload = (await response.json()) as { event?: LiveEvent; metrics?: Metrics };
      if (payload.metrics) setMetrics((current) => ({ ...current, ...payload.metrics }));
      if (payload.event) setEvents((current) => [payload.event!, ...current].slice(0, compact ? 4 : 8));
    }, 5000);

    return () => {
      window.clearInterval(fallback);
      socket.disconnect();
    };
  }, [compact]);

  const metricCards = [
    { label: "Utilisateurs live", value: String(metrics.onlineUsers), icon: Wifi, tone: "text-emerald-300" },
    { label: "Paiements/min", value: String(metrics.paymentsPerMinute), icon: Activity, tone: "text-gold" },
    { label: "Risque moyen", value: `${metrics.fraudRiskAverage}/100`, icon: ShieldCheck, tone: "text-emerald-300" },
    { label: "Latence", value: `${metrics.latencyMs}ms`, icon: Gauge, tone: "text-smoke" }
  ];

  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-gold">Centre de controle live</p>
          <h2 className="mt-1 text-xl font-black tracking-normal">Monitoring operations</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black">
          <RadioTower size={15} className={connected ? "text-emerald-300" : "text-gold"} />
          {connected ? "connecte" : "sync"}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl bg-white/[0.08] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase text-smoke">{item.label}</p>
                <Icon size={17} className={item.tone} />
              </div>
              <p className="text-2xl font-black">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-amber-400/10 p-4 ring-1 ring-amber-300/15">
          <p className="text-xs text-smoke">Paiements attente</p>
          <p className="mt-1 text-2xl font-black text-gold">{metrics.pendingPayments}</p>
        </div>
        <div className="rounded-2xl bg-rose-400/10 p-4 ring-1 ring-rose-300/15">
          <p className="text-xs text-smoke">Paiements echoues</p>
          <p className="mt-1 text-2xl font-black text-rose-300">{metrics.failedPayments}</p>
        </div>
        <div className="rounded-2xl bg-emerald-400/10 p-4 ring-1 ring-emerald-300/15">
          <p className="text-xs text-smoke">Groupes actifs</p>
          <p className="mt-1 text-2xl font-black text-emerald-300">{metrics.activeGroups}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black">Flux mondial</p>
          <AlertTriangle size={18} className="text-gold" />
        </div>
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-2 light:bg-white/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{event.title}</p>
                <p className="text-xs text-smoke">
                  {event.type} - {event.region} - {eventTime(event.generatedAt)}
                </p>
              </div>
              <p className="shrink-0 text-xs font-black text-emerald-300">{event.amount > 0 ? money(event.amount, event.currency) : event.currency}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
