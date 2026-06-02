"use client";

import { Loader2, RotateCcw, X, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  txId: string;
  status: string;
  provider: string | null;
  amountCents: number;
  currency: string;
  reference: string;
};

export function TransactionActions({ txId, status, provider, amountCents, currency }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"cancel" | "retry" | null>(null);

  if (status !== "PENDING" && status !== "FAILED") return null;
  if (!["WALLET_DEPOSIT"].includes("WALLET_DEPOSIT")) return null; // only on deposits - always true, kept for clarity

  async function cancel() {
    setLoading("cancel");
    await fetch(`/api/transactions/${txId}/cancel`, { method: "POST" });
    setLoading(null);
    router.refresh();
  }

  function retry() {
    setLoading("retry");
    if (provider === "CINETPAY") {
      window.location.assign(`/wallet/deposit/cinetpay?amount=${amountCents}`);
    } else {
      window.location.assign(`/wallet/deposit`);
    }
  }

  return (
    <div className="flex gap-1.5">
      {status === "PENDING" && (
        <button
          onClick={retry}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-xl bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-50"
          title="Continuer le paiement"
        >
          {loading === "retry" ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
          Continuer
        </button>
      )}
      {status === "FAILED" && (
        <button
          onClick={retry}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-[var(--muted)] transition hover:bg-white/15 disabled:opacity-50"
          title="Réessayer"
        >
          {loading === "retry" ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
          Réessayer
        </button>
      )}
      {status === "PENDING" && (
        <button
          onClick={cancel}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-xl bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
          title="Annuler"
        >
          {loading === "cancel" ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
          Annuler
        </button>
      )}
    </div>
  );
}
