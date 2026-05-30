"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountButton() {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setStep("loading");
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Impossible de supprimer le compte.");
      setStep("confirm");
      return;
    }
    router.push("/login?deleted=1");
  }

  if (step === "confirm") {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4">
        <p className="mb-3 text-sm font-bold text-red-300">Supprimer définitivement votre compte et toutes vos données ?</p>
        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => void handleDelete()}
            className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-bold text-white transition hover:bg-red-400">
            Confirmer la suppression
          </button>
          <button onClick={() => { setStep("idle"); setError(null); }}
            className="flex-1 rounded-xl bg-white/10 py-2 text-sm font-bold transition hover:bg-white/15">
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setStep("confirm")}
      className="flex w-full items-center justify-between rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/15">
      <span className="flex items-center gap-2">
        <Trash2 size={15} />
        Supprimer mon compte (RGPD)
      </span>
      <span>→</span>
    </button>
  );
}
