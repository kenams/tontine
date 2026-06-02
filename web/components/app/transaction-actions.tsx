"use client";

import { Loader2, RotateCcw, Trash2, Play } from "lucide-react";
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

export function TransactionActions({ txId, status, provider, amountCents }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"delete" | "cancel" | "retry" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "PENDING" && status !== "FAILED") return null;

  async function deleteOrCancel() {
    setLoading(status === "PENDING" ? "cancel" : "delete");
    setError(null);
    try {
      const endpoint = status === "PENDING"
        ? `/api/transactions/${txId}/cancel`
        : `/api/transactions/${txId}/delete`;
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Erreur.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(null);
    }
  }

  function retry() {
    setLoading("retry");
    if (provider === "CINETPAY") {
      window.location.assign(`/wallet/deposit/cinetpay?amount=${amountCents}`);
    } else {
      window.location.assign("/wallet/deposit");
    }
  }

  const isDeleting = loading === "delete" || loading === "cancel";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1.5">
        {status === "PENDING" && (
          <button
            onClick={() => void retry()}
            disabled={loading !== null}
            className="flex items-center gap-1 rounded-xl bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-50"
          >
            {loading === "retry" ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
            Continuer
          </button>
        )}
        {status === "FAILED" && (
          <button
            onClick={() => void retry()}
            disabled={loading !== null}
            className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-[var(--muted)] transition hover:bg-white/15 disabled:opacity-50"
          >
            {loading === "retry" ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
            Réessayer
          </button>
        )}
        <button
          onClick={() => void deleteOrCancel()}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-xl bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
        >
          {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
          {status === "PENDING" ? "Annuler" : "Supprimer"}
        </button>
      </div>
      {error && <p className="text-[10px] text-rose-400 pl-1">{error}</p>}
    </div>
  );
}
