"use client";

import {
  ArrowLeft, CreditCard, Loader2,
  Smartphone, Star, Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";

const PRESETS = [
  { label: "5 €", cents: 500 },
  { label: "10 €", cents: 1000 },
  { label: "25 €", cents: 2500 },
  { label: "50 €", cents: 5000 },
  { label: "100 €", cents: 10000 },
  { label: "200 €", cents: 20000 },
];

type Method = "card" | "mobile";

function DepositContent() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";
  const { t } = useLanguage();

  const METHODS = [
    {
      id: "card" as Method,
      icon: CreditCard,
      label: t("deposit", "cardLabel"),
      sub: "Visa · Mastercard · Apple Pay · Google Pay",
      badge: t("deposit", "instantBadge"),
      badgeColor: "bg-emerald-500/15 text-emerald-400",
      available: true,
      recommended: true,
    },
    {
      id: "mobile" as Method,
      icon: Smartphone,
      label: "Mobile Money",
      sub: "Orange Money · MTN · Wave · Moov",
      badge: "Bientôt",
      badgeColor: "bg-white/10 text-[var(--muted)]",
      available: false,
      recommended: false,
    },
  ];

  const [method, setMethod] = useState<Method>("card");
  // Mobile Money désactivé jusqu'à validation CinetPay KYC
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = selected ?? (custom ? Math.round(parseFloat(custom) * 100) : null);

  async function handleDeposit() {
    if (!amountCents || amountCents < 500) { setError(t("deposit", "errMin")); return; }
    if (amountCents > 500_000) { setError(t("deposit", "errMax")); return; }
    setLoading(true);
    setError(null);

    if (method === "mobile") {
      window.location.assign(`/wallet/deposit/cinetpay?amount=${amountCents}`);
      return;
    }

    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setError(data?.error ?? t("deposit", "errMin")); return; }
    if (data?.checkoutUrl) window.location.assign(data.checkoutUrl);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="mx-auto max-w-sm">

        <div className="mb-6 flex items-center gap-3">
          <Link href="/wallet" className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 hover:bg-white/15 transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{t("deposit", "navTitle")}</p>
            <h1 className="text-xl font-black">{t("deposit", "title")}</h1>
          </div>
        </div>

        {cancelled && (
          <div className="mb-4 rounded-3xl border border-gold/30 bg-gold/10 p-4 text-sm font-bold text-gold">
            {t("deposit", "cancelled")}
          </div>
        )}

        <div className="glass mb-4 rounded-[1.75rem] p-5">
          <p className="mb-3 text-sm font-black">{t("deposit", "methodTitle")}</p>
          <div className="space-y-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  disabled={!m.available}
                  onClick={() => { if (m.available) { setMethod(m.id); setError(null); } }}
                  className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                    active ? "ring-1 ring-emerald-400/40 bg-emerald-500/8" : m.available ? "bg-[var(--surface)] hover:bg-[var(--surface-strong)]" : "bg-[var(--surface)] opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-emerald-500/20" : "bg-white/10"}`}>
                    <Icon size={18} className={active ? "text-emerald-400" : "text-[var(--muted)]"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{m.label}</p>
                      {"recommended" in m && m.recommended && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-400 uppercase tracking-wide">Recommandé</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] truncate">{m.sub}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${m.badgeColor}`}>{m.badge}</span>
                  {active && <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {method === "card" && (
          <div className="glass mb-4 rounded-[1.75rem] p-5">
            <p className="mb-3 text-sm font-black">{t("deposit", "amountTitle")}</p>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.cents}
                  onClick={() => { setSelected(p.cents); setCustom(""); setError(null); }}
                  className={`rounded-2xl py-3 text-sm font-bold transition ${selected === p.cents && !custom ? "bg-emerald-500 text-black" : "bg-white/10 hover:bg-white/15"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">{t("deposit", "customLabel")}</label>
              <input
                type="number" min="5" max="5000" step="1" placeholder="ex : 75"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setSelected(null); setError(null); }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm outline-none focus:border-emerald-400/40 transition"
              />
            </div>
            {amountCents && amountCents >= 500 && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3">
                <Zap size={14} className="shrink-0 text-emerald-400" />
                <p className="text-sm font-bold text-emerald-200">
                  {(amountCents / 100).toFixed(2)} € · {t("deposit", "instantCredit")}
                </p>
              </div>
            )}
            {error && <div className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>}
            <Button onClick={handleDeposit} disabled={loading || !amountCents || amountCents < 500} className="w-full">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
              {loading ? t("deposit", "btnOpening") : t("deposit", "btnStripe")}
            </Button>
          </div>
        )}

        {method === "mobile" && (
          <div className="glass mb-4 rounded-[1.75rem] p-5">
            <p className="mb-3 text-sm font-black">{t("deposit", "amountTitle")}</p>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { label: "1 000 XOF", cents: 100000 },
                { label: "2 500 XOF", cents: 250000 },
                { label: "5 000 XOF", cents: 500000 },
                { label: "10 000 XOF", cents: 1000000 },
                { label: "25 000 XOF", cents: 2500000 },
                { label: "50 000 XOF", cents: 5000000 },
              ].map((p) => (
                <button
                  key={p.cents}
                  onClick={() => { setSelected(p.cents); setCustom(""); setError(null); }}
                  className={`rounded-2xl py-3 text-xs font-bold transition ${selected === p.cents && !custom ? "bg-emerald-500 text-black" : "bg-white/10 hover:bg-white/15"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {error && <div className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>}
            <Button onClick={handleDeposit} disabled={loading || !amountCents || amountCents < 30000} className="w-full">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}
              {loading ? t("deposit", "btnOpening") : "Payer via Mobile Money"}
            </Button>
          </div>
        )}

        <div className="glass rounded-3xl p-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5">
            <Star size={12} className="text-gold" />
            <p className="text-xs font-bold">{t("deposit", "secureTitle")}</p>
          </div>
          <p className="text-[11px] text-[var(--muted)]">{t("deposit", "secureDesc")}</p>
        </div>

      </div>
    </div>
  );
}

export default function WalletDepositPage() {
  return (
    <Suspense>
      <DepositContent />
    </Suspense>
  );
}
