"use client";

import { ArrowLeft, Loader2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CinetpayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const txRef = params.get("tx_ref");
  const status = params.get("status");
  const amountFromUrl = params.get("amount");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Retour depuis CinetPay — vérifier le statut
  useEffect(() => {
    if (!txRef || !status) return;
    setVerifying(true);
    fetch(`/api/wallet/deposit/cinetpay/verify?tx_ref=${txRef}`)
      .then((r) => r.json())
      .then((d: { ok?: boolean; alreadyCredited?: boolean; amountCents?: number }) => {
        if (d.ok) setSuccess(true);
        else setError("Paiement non confirmé. Réessaie ou contacte le support.");
      })
      .catch(() => setError("Erreur réseau."))
      .finally(() => setVerifying(false));
  }, [txRef, status]);

  async function initPayment() {
    const amountCents = Number(amountFromUrl);
    if (!amountCents || amountCents < 30000) {
      setError("Montant invalide. Retourne en arrière et sélectionne un montant.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/deposit/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, currency: "XOF" }),
      });
      const data = await res.json() as { ok?: boolean; paymentUrl?: string; error?: string };
      if (!res.ok || !data.paymentUrl) { setError(data.error ?? "Erreur d'initialisation."); return; }
      window.location.assign(data.paymentUrl);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)]">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
        <p className="font-bold">Vérification du paiement…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20">
          <Smartphone size={28} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black">Paiement confirmé ✅</h1>
        <p className="text-[var(--muted)]">Votre wallet a été crédité.</p>
        <Link href="/wallet" className="mt-4 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black">
          Voir mon wallet
        </Link>
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
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Mobile Money</p>
            <h1 className="text-xl font-black">CinetPay</h1>
          </div>
        </div>

        <div className="glass mb-4 rounded-[1.75rem] p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4">
            <Smartphone size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold">Orange Money · MTN · Wave · Moov</p>
              <p className="text-xs text-[var(--muted)]">CI, SN, BF, ML, CM, TG, BJ et plus</p>
            </div>
          </div>

          {amountFromUrl && (
            <div className="rounded-2xl bg-white/5 px-4 py-3 text-center">
              <p className="text-xs text-[var(--muted)]">Montant</p>
              <p className="text-2xl font-black">{(Number(amountFromUrl) / 100).toLocaleString("fr-FR")} XOF</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>
          )}

          <button
            onClick={initPayment}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}
            {loading ? "Redirection…" : "Payer maintenant"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CinetpayDepositPage() {
  return (
    <Suspense>
      <CinetpayContent />
    </Suspense>
  );
}
