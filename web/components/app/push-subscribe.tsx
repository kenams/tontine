"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

const VAPID_PUBLIC_KEY = "BFfhNfiQk-domnclYRatx6tTSod-8-FhOag1z26NjsnBOmLB3j5kOov1C1Tl2Yfp2lSY8-N7uA0gDY4wNRW3dy4";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushSubscribeButton() {
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "loading" | "unsupported">("idle");
  const { t } = useLanguage();

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("subscribed");
    else if (Notification.permission === "denied") setStatus("denied");
  }, []);

  async function subscribe() {
    if (!("serviceWorker" in navigator)) return;
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
      });
      setStatus("subscribed");
    } catch {
      setStatus("idle");
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("idle");
    } catch {
      setStatus("idle");
    }
  }

  if (status === "unsupported") return null;

  const desc = status === "subscribed" ? t("push", "enabled")
    : status === "denied" ? t("push", "blocked")
    : t("push", "desc");

  return (
    <div className="glass mb-3 flex items-center gap-3 rounded-3xl p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${status === "subscribed" ? "bg-emerald-500/15" : "bg-white/10"}`}>
        {status === "subscribed"
          ? <Bell size={18} className="text-emerald-400" />
          : <BellOff size={18} className="text-[var(--muted)]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black">{t("push", "title")}</p>
        <p className="text-sm text-smoke">{desc}</p>
      </div>
      {status === "loading"
        ? <Loader2 size={18} className="animate-spin text-[var(--muted)]" />
        : status === "subscribed"
        ? (
          <button onClick={unsubscribe} className="relative h-7 w-12 rounded-full bg-emerald-500 transition-colors">
            <span className="absolute left-6 top-1 h-5 w-5 rounded-full bg-white shadow transition-all" />
          </button>
        )
        : status === "denied"
        ? <span className="text-xs text-[var(--muted)]">{t("push", "blockedLabel")}</span>
        : (
          <button onClick={subscribe} className="relative h-7 w-12 rounded-full bg-white/20 transition-colors">
            <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-all" />
          </button>
        )
      }
    </div>
  );
}
