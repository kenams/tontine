"use client";

import { ArrowLeft, Building2, CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const PRESETS = [
  { label: "20 €", cents: 2000 },
  { label: "50 €", cents: 5000 },
  { label: "100 €", cents: 10000 },
  { label: "250 €", cents: 25000 },
  { label: "500 €", cents: 50000 },
];

type Instructions = {
  iban: string;
  bic: string;
  accountHolderName: string;
  reference: string;
  amount: number;
  currency: string;
  hostedInstructionsUrl?: string;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-strong)] px-4 py-3">
      <div>
        <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{label}</p>
        <p className="font-black tracking-wide">{value}</p>
      </div>
      <button onClick={copy} className="shrink-0 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/15 transition">
        {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export default function SepaDepositPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);

  const amountCents = selected ?? (custom ? Math.round(parseFloat(custom) * 100) : null);

  async function handleInit() {
    if (!amountCents || amountCents < 500) { setError("Montant minimum : 5 €"); return; }
    if (amountCents > 500_000) { setError("Montant maximum : 5 000 €"); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/wallet/deposit/sepa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setError(data?.error ?? "Erreur lors de la création du virement."); return; }
    setInstructions(data.instructions);
  }

  if (instructions) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
        <div className="mx-auto max-w-sm">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/wallet/deposit" className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 hover:bg-white/15 transition">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Virement SEPA</p>
              <h1 className="text-xl font-black">Vos coordonnées</h1>
            </div>
          </div>

          <div className="glass mb-4 rounded-[1.75rem] p-5">
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
              <p className="text-sm font-bold text-emerald-200">
                Virement de <span className="text-emerald-400">{instructions.amount.toFixed(2)} {instructions.currency}</span> initié
              </p>
            </div>

            <p className="mb-3 text-sm font-black">Effectuez un virement vers :</p>

            <div className="space-y-2">
              <CopyField label="IBAN" value={instructions.iban} />
              <CopyField label="BIC / SWIFT" value={instructions.bic} />
              <CopyField label="Bénéficiaire" value={instructions.accountHolderName} />
              <CopyField label="Référence (obligatoire)" value={instructions.reference} />
              <CopyField label="Montant" value={`${instructions.amount.toFixed(2)} ${instructions.currency}`} />
            </div>
          </div>

          <div className="glass mb-4 rounded-3xl p-4">
            <p className="mb-2 text-sm font-black text-gold">Important</p>
            <ul className="space-y-1.5 text-xs text-[var(--muted)]">
              <li>• Copiez la <strong className="text-[var(--text)]">référence exacte</strong> dans votre virement</li>
              <li>• Le montant doit être <strong className="text-[var(--text)]">exactement {instructions.amount.toFixed(2)} €</strong></li>
              <li>• Délai de crédit : <strong className="text-[var(--text)]">1 à 3 jours ouvrés</strong></li>
              <li>• Compatible avec tous les virements SEPA (Revolut, N26, BNP, etc.)</li>
            </ul>
          </div>

          {instructions.hostedInstructionsUrl && (
            <a
              href={instructions.hostedInstructionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-3xl bg-white/10 p-4 text-sm font-bold hover:bg-white/15 transition"
            >
              <ExternalLink size={16} />
              Instructions complètes Stripe
            </a>
          )}

          <div className="mt-4 text-center">
            <Link href="/wallet" className="text-sm text-[var(--muted)] underline">
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
          <Link href="/wallet/deposit" className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 hover:bg-white/15 transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Wallet</p>
            <h1 className="text-xl font-black">Virement SEPA</h1>
          </div>
        </div>

        <div className="glass mb-4 rounded-[1.75rem] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-emerald-400" />
            <p className="text-sm font-black">Compatible Revolut · N26 · Banque traditionnelle</p>
          </div>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Nous générons un IBAN virtuel unique pour ce dépôt. Effectuez le virement depuis votre banque — les fonds arrivent sous 1 à 3 jours ouvrés.
          </p>

          <p className="mb-3 text-sm font-black">Choisissez un montant</p>
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

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Montant personnalisé (€)</label>
            <input
              type="number" min="5" max="5000" step="1" placeholder="ex : 150"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected(null); setError(null); }}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm outline-none focus:border-emerald-400/40 transition"
            />
          </div>

          {error && <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>}

          <Button onClick={handleInit} disabled={loading || !amountCents || amountCents < 500} className="w-full">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Building2 size={18} />}
            {loading ? "Génération de l'IBAN..." : "Obtenir les coordonnées SEPA"}
          </Button>
        </div>
      </div>
    </div>
  );
}
