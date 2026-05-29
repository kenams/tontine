"use client";

import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";

const PRESETS = [
  { label: "5 €", cents: 500 },
  { label: "10 €", cents: 1000 },
  { label: "25 €", cents: 2500 },
  { label: "50 €", cents: 5000 },
  { label: "100 €", cents: 10000 },
  { label: "200 €", cents: 20000 },
];

function DepositContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";

  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = selected ?? (custom ? Math.round(parseFloat(custom) * 100) : null);

  async function handleDeposit() {
    if (!amountCents || amountCents < 500) {
      setError("Montant minimum : 5 €");
      return;
    }
    if (amountCents > 500_000) {
      setError("Montant maximum : 5 000 €");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Erreur lors de la création du paiement.");
      return;
    }

    if (data?.checkoutUrl) {
      window.location.assign(data.checkoutUrl);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/wallet" className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 hover:bg-white/15 transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Wallet</p>
            <h1 className="text-xl font-black">Recharger</h1>
          </div>
        </div>

        {cancelled && (
          <div className="mb-4 rounded-3xl border border-gold/30 bg-gold/10 p-4 text-sm font-bold text-gold">
            Paiement annulé. Choisissez un montant pour réessayer.
          </div>
        )}

        <div className="glass mb-4 rounded-[1.75rem] p-5">
          <p className="mb-4 text-sm font-black">Choisissez un montant</p>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.cents}
                onClick={() => { setSelected(p.cents); setCustom(""); setError(null); }}
                className={`rounded-2xl py-3 text-sm font-bold transition ${
                  selected === p.cents && !custom
                    ? "bg-emerald-500 text-black"
                    : "bg-white/10 hover:bg-white/15"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Montant personnalisé (€)</label>
            <input
              type="number"
              min="5"
              max="5000"
              step="1"
              placeholder="ex : 75"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected(null); setError(null); }}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm outline-none focus:border-emerald-400/40 focus:bg-white/[0.12] transition"
            />
          </div>

          {amountCents && amountCents >= 500 ? (
            <div className="mb-4 rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-sm font-bold text-emerald-400">
                Vous allez déposer <span className="text-lg">{(amountCents / 100).toFixed(2)} €</span>
              </p>
              <p className="text-xs text-[var(--muted)]">Paiement sécurisé par Stripe · Carte Visa / Mastercard</p>
            </div>
          ) : null}

          {error && (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
              {error}
            </div>
          )}

          <Button
            onClick={handleDeposit}
            disabled={loading || !amountCents || amountCents < 500}
            className="w-full"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CreditCard size={18} />
            )}
            {loading ? "Redirection Stripe..." : "Recharger via Stripe"}
          </Button>
        </div>

        <div className="glass rounded-3xl p-4 text-center">
          <p className="text-xs text-[var(--muted)]">
            Les fonds sont crédités instantanément après confirmation Stripe.<br />
            Vous pourrez payer vos cotisations en 1 clic.
          </p>
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
