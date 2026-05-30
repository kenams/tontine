"use client";

import { ArrowLeft, Building2, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WalletWithdrawPage() {
  const router = useRouter();
  const [amountStr, setAmountStr] = useState("");
  const [iban, setIban] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const amountCents = amountStr ? Math.round(parseFloat(amountStr) * 100) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanIban = iban.replace(/\s/g, "").toUpperCase();
    if (amountCents < 10_00) { setError("Montant minimum : 10 €"); return; }
    if (amountCents > 200_000_00) { setError("Montant maximum : 2 000 €"); return; }
    if (!cleanIban) { setError("IBAN requis."); return; }
    if (!beneficiary.trim()) { setError("Nom du bénéficiaire requis."); return; }

    setLoading(true);
    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents, iban: cleanIban, beneficiary: beneficiary.trim() }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Erreur lors de la demande de retrait.");
      return;
    }

    setSuccess(data?.reference ?? "WIT-OK");
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
        <div className="mx-auto max-w-sm">
          <div className="glass rounded-[1.75rem] p-8 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-400" />
            <h2 className="mb-2 text-xl font-black">Retrait soumis</h2>
            <p className="mb-1 text-sm text-[var(--muted)]">Référence : <span className="font-bold text-[var(--text)]">{success}</span></p>
            <p className="mb-6 text-sm text-[var(--muted)]">
              Le virement sera effectué sous 1 à 3 jours ouvrés. Un email de confirmation vous sera envoyé.
            </p>
            <Link href="/wallet" className="block rounded-2xl bg-emerald-500 py-3 text-center text-sm font-black text-ink transition hover:bg-emerald-400">
              Retour au wallet
            </Link>
          </div>
        </div>
      </div>
    );
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
            <h1 className="text-xl font-black">Retirer</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass rounded-[1.75rem] p-5">
            <p className="mb-4 text-sm font-black">Coordonnées bancaires</p>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Montant (€)</label>
              <Input
                type="number" min="10" max="2000" step="0.01"
                placeholder="ex : 50"
                value={amountStr}
                onChange={(e) => { setAmountStr(e.target.value); setError(null); }}
                required
              />
              <p className="mt-1 text-[10px] text-[var(--muted)]">Min : 10 € · Max : 2 000 €</p>
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">IBAN</label>
              <Input
                type="text"
                placeholder="FR76 3000 6000 0112 3456 7890 189"
                value={iban}
                onChange={(e) => { setIban(e.target.value); setError(null); }}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Nom du bénéficiaire</label>
              <Input
                type="text"
                placeholder="Prénom Nom"
                value={beneficiary}
                onChange={(e) => { setBeneficiary(e.target.value); setError(null); }}
                required
              />
            </div>
          </div>

          <div className="glass rounded-3xl px-4 py-3 flex items-start gap-3">
            <Building2 size={16} className="mt-0.5 shrink-0 text-[var(--muted)]" />
            <p className="text-xs text-[var(--muted)]">
              Le solde est débité immédiatement. Le virement SEPA arrive sous 1–3 jours ouvrés. Minimum de retrait : 10 €.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Building2 size={18} />}
            {loading ? "Traitement..." : "Soumettre le retrait"}
          </Button>
        </form>
      </div>
    </div>
  );
}
