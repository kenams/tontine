"use client";
import { Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

export function PremiumCheckoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();

  async function handleClick() {
    setLoading(true);
    try {
      const r = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe" }),
      });
      const data = await r.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else if (data.error) alert(data.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? "flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-sm font-black text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.35)] transition hover:bg-emerald-400 disabled:opacity-60"}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} fill="currentColor" />}
      {loading
        ? (lang === "en" ? "Redirecting…" : "Redirection…")
        : (lang === "en" ? "Upgrade to Premium — 4.99€/mo" : "Passer Premium — 4,99€/mois")}
    </button>
  );
}

export function PremiumPortalButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();

  async function handleClick() {
    setLoading(true);
    try {
      const r = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const data = await r.json();
      if (data.portalUrl) window.location.href = data.portalUrl;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? "rounded-xl border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-60"}
    >
      {loading ? <Loader2 size={12} className="animate-spin inline" /> : null}
      {lang === "en" ? "Manage subscription" : "Gérer l'abonnement"}
    </button>
  );
}
