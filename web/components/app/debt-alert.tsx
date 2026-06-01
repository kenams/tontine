"use client";

import { AlertTriangle, WalletCards } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { groupId: string; debtCents: number; currency: string };

export function DebtAlert({ groupId, debtCents, currency }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (debtCents <= 0) return null;

  const formatted = (debtCents / 100).toLocaleString("fr-FR", { style: "currency", currency });

  async function handleRepay() {
    setLoading(true);
    const res = await fetch(`/api/tontines/${groupId}/repay-debt`, { method: "POST" });
    const data = await res.json() as { ok?: boolean; error?: string; message?: string };
    if (data.ok) {
      router.refresh();
    } else {
      alert(data.error ?? "Solde insuffisant — rechargez votre wallet.");
    }
    setLoading(false);
  }

  return (
    <div className="mb-4 rounded-3xl border border-gold/25 bg-gold/8 p-4">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle size={16} className="text-gold shrink-0" />
        <p className="text-sm font-black text-gold">Dette envers le groupe</p>
      </div>
      <p className="mb-3 text-sm text-[var(--muted)] leading-5">
        Vous devez <strong className="text-gold">{formatted}</strong> à ce groupe (pot reçu non encore entièrement remboursé via cotisations).
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/wallet/deposit"
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--surface)] px-3 py-2.5 text-xs font-bold ring-1 ring-[var(--surface-strong)]"
        >
          <WalletCards size={13} /> Recharger
        </Link>
        <button
          onClick={handleRepay}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-gold px-3 py-2.5 text-xs font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "..." : `Rembourser ${formatted}`}
        </button>
      </div>
    </div>
  );
}
