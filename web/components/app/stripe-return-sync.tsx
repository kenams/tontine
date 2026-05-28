"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function StripeReturnSync({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "syncing" | "paid" | "pending" | "error">("idle");

  useEffect(() => {
    if (!sessionId || status !== "idle") return;

    setStatus("syncing");
    fetch("/api/payments/stripe/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    })
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) {
          setStatus("error");
          return;
        }
        setStatus(body.status === "PAID" ? "paid" : "pending");
        router.refresh();
      })
      .catch(() => setStatus("error"));
  }, [router, sessionId, status]);

  if (!sessionId || status === "idle") return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-3xl bg-white/[0.08] p-4 text-sm font-bold">
      {status === "syncing" ? <Loader2 size={18} className="animate-spin text-gold" /> : <CheckCircle2 size={18} className="text-emerald-300" />}
      <span>
        {status === "syncing"
          ? "Synchronisation Stripe en cours..."
          : status === "paid"
            ? "Cotisation Stripe confirmee."
            : status === "pending"
              ? "Paiement Stripe en attente de confirmation."
              : "Synchronisation Stripe indisponible."}
      </span>
    </div>
  );
}
