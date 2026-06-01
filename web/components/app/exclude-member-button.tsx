"use client";

import { UserX, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { groupId: string; membershipId: string; memberName: string };

export function ExcludeMemberButton({ groupId, membershipId, memberName }: Props) {
  const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");
  const [reason, setReason] = useState("Non-paiement persistant");
  const router = useRouter();

  async function handleExclude() {
    setStep("loading");
    const res = await fetch(`/api/tontines/${groupId}/members/${membershipId}/exclude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json() as { ok?: boolean; error?: string; message?: string };
    if (data.ok) {
      router.refresh();
      setStep("idle");
    } else {
      alert(data.error ?? "Erreur.");
      setStep("idle");
    }
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm")}
        className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-400 ring-1 ring-rose-500/20 transition hover:bg-rose-500/20"
        title={`Exclure ${memberName}`}
      >
        <UserX size={12} /> Exclure
      </button>
    );
  }

  if (step === "confirm") {
    return (
      <div className="col-span-full glass rounded-2xl p-3 ring-1 ring-rose-500/20">
        <p className="mb-2 text-xs font-black text-rose-400 flex items-center gap-1.5">
          <AlertTriangle size={13} /> Exclure {memberName} ?
        </p>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-2 w-full rounded-xl border border-white/10 bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-emerald-400/40"
          placeholder="Raison..."
        />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setStep("idle")} className="rounded-xl bg-[var(--surface)] px-3 py-2 text-xs font-bold">
            Annuler
          </button>
          <button onClick={handleExclude} className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white">
            Confirmer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-[var(--surface)] px-2.5 py-1.5 text-[11px] text-[var(--muted)]">
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}
