"use client";

import { ArrowRight, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PRESETS = [1000, 2500, 5000, 10000, 25000, 50000]; // en XOF

const CURRENCIES = [
  { code: "XOF", label: "XOF — Wave / Orange Money / MTN (Afrique de l'Ouest)" },
  { code: "GHS", label: "GHS — MTN / Vodafone (Ghana)" },
  { code: "KES", label: "KES — M-Pesa (Kenya)" },
  { code: "UGX", label: "UGX — MTN / Airtel (Ouganda)" },
  { code: "NGN", label: "NGN — USSD (Nigeria)" },
];

export default function MobileMoneyInitiatePage() {
  const [amount, setAmount] = useState(5000);
  const [currency, setCurrency] = useState("XOF");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/wallet/deposit/flutterwave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: amount * 100, currency }),
    });
    const data = await res.json() as { ok?: boolean; paymentLink?: string; error?: string };
    if (data.ok && data.paymentLink) {
      window.location.href = data.paymentLink;
    } else {
      setError(data.error ?? "Erreur initialisation paiement.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6 bg-[var(--bg)]">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/wallet" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500 font-black text-ink text-sm">K</span>
          <span className="text-sm font-black">Kotizy</span>
        </Link>
        <Link href="/wallet" className="text-xs text-[var(--muted)] hover:text-[var(--text)]">← Wallet</Link>
      </div>

      <div className="glass rounded-[1.75rem] p-5">
        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <Smartphone size={13} /> Mobile Money
          </div>
          <h1 className="text-2xl font-black">Recharger via Mobile Money</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Wave · Orange Money · MTN MoMo · M-Pesa</p>
        </div>

        {/* Devise */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Devise & opérateur</label>
          <select
            value={currency}
            onChange={(e) => { setCurrency(e.target.value); setAmount(e.target.value === "XOF" ? 5000 : 10); }}
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-none focus:border-emerald-400/60"
            style={{ colorScheme: "dark" }}
          >
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>

        {/* Presets XOF */}
        {currency === "XOF" && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Montant rapide</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => setAmount(p)}
                  className={`rounded-2xl py-2.5 text-sm font-bold transition ${amount === p ? "bg-emerald-500 text-ink shadow-glow" : "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-strong)]"}`}>
                  {p.toLocaleString("fr-FR")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Montant custom */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
            Montant ({currency}) {currency === "XOF" && <span className="text-[var(--muted)]">— min. 1 000</span>}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={currency === "XOF" ? 1000 : 1}
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-none focus:border-emerald-400/60"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        <button
          onClick={handlePay}
          disabled={loading || amount <= 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-ink shadow-glow transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Redirection…" : `Payer ${amount.toLocaleString("fr-FR")} ${currency}`}
          <ArrowRight size={16} />
        </button>

        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          Vous serez redirigé vers la page de paiement sécurisée Flutterwave.
        </p>
      </div>
    </div>
  );
}
