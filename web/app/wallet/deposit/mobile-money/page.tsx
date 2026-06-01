"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "failed" | "cancelled";

export default function MobileMoneyReturnPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    const flwStatus = params.get("status");
    const txRef = params.get("tx_ref");
    const transactionId = params.get("transaction_id");

    if (flwStatus === "cancelled") { setStatus("cancelled"); return; }

    if (!txRef || !transactionId) { setStatus("failed"); return; }

    fetch(`/api/wallet/deposit/flutterwave/verify?tx_ref=${txRef}&transaction_id=${transactionId}`)
      .then((r) => r.json())
      .then((data: { ok?: boolean; amountCents?: number; currency?: string; alreadyCredited?: boolean }) => {
        if (data.ok) {
          if (data.amountCents) {
            setAmount(`${(data.amountCents / 100).toLocaleString("fr-FR")} ${data.currency ?? ""}`);
          }
          setStatus("success");
          setTimeout(() => router.push("/wallet?deposit=success"), 2500);
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [params, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-base font-black text-ink">K</span>
        <span className="text-sm font-black">Kotizy</span>
      </Link>

      {status === "loading" && (
        <>
          <Loader2 size={40} className="mb-4 animate-spin text-emerald-400" />
          <p className="font-black text-lg">Vérification en cours…</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Confirmation du paiement Mobile Money.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 size={48} className="mb-4 text-emerald-400" />
          <p className="font-black text-2xl text-emerald-400">Paiement confirmé !</p>
          {amount && <p className="mt-2 text-lg font-black">{amount} crédités</p>}
          <p className="mt-2 text-sm text-[var(--muted)]">Redirection vers votre wallet…</p>
        </>
      )}

      {status === "failed" && (
        <>
          <XCircle size={48} className="mb-4 text-rose-400" />
          <p className="font-black text-lg">Paiement échoué</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Le paiement n'a pas abouti ou a été annulé.</p>
          <Link href="/wallet/deposit" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-ink">
            Réessayer
          </Link>
        </>
      )}

      {status === "cancelled" && (
        <>
          <XCircle size={48} className="mb-4 text-gold" />
          <p className="font-black text-lg">Paiement annulé</p>
          <Link href="/wallet" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-6 py-3 text-sm font-bold ring-1 ring-[var(--surface-strong)]">
            Retour au wallet
          </Link>
        </>
      )}
    </div>
  );
}
