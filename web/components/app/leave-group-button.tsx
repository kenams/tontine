"use client";

import { LogOut, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

type Props = { groupId: string; groupName: string };

export function LeaveGroupButton({ groupId, groupName }: Props) {
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "debt">("idle");
  const [debtCents, setDebtCents] = useState(0);
  const [debtMsg, setDebtMsg] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  async function handleLeave() {
    setStep("loading");
    const res = await fetch(`/api/tontines/${groupId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Désistement volontaire" }),
    });
    const data = await res.json() as { error?: string; debtCents?: number; message?: string };

    if (res.status === 402 && data.debtCents) {
      setDebtCents(data.debtCents);
      setDebtMsg(data.error ?? "");
      setStep("debt");
    } else if (res.ok) {
      router.push("/tontines");
      router.refresh();
    } else {
      alert(data.error ?? t("leave", "errGeneric"));
      setStep("idle");
    }
  }

  async function handleRepay() {
    setStep("loading");
    const res = await fetch(`/api/tontines/${groupId}/repay-debt`, { method: "POST" });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      await handleLeave();
    } else {
      alert(data.error ?? t("leave", "insufficientMsg"));
      setStep("debt");
    }
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 ring-1 ring-rose-500/20 transition hover:bg-rose-500/20"
      >
        <LogOut size={15} /> {t("leave", "btnLabel")}
      </button>
    );
  }

  if (step === "confirm") {
    return (
      <div className="glass rounded-3xl p-4 ring-1 ring-rose-500/20">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-rose-400">
          <AlertTriangle size={16} /> {t("leave", "confirm")} "{groupName}" ?
        </div>
        <p className="mb-4 text-xs text-[var(--muted)] leading-5">{t("leave", "warning")}</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setStep("idle")} className="rounded-2xl bg-[var(--surface)] px-4 py-2.5 text-sm font-bold transition hover:bg-[var(--surface-strong)]">
            {t("leave", "cancel")}
          </button>
          <button onClick={handleLeave} className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-400">
            {t("leave", "confirm")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
        {t("leave", "processing")}
      </div>
    );
  }

  if (step === "debt") {
    return (
      <div className="glass rounded-3xl p-4 ring-1 ring-gold/20">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-gold">
          <AlertTriangle size={16} /> {t("leave", "debtTitle")}
        </div>
        <p className="mb-4 text-sm text-[var(--muted)] leading-5">{debtMsg}</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setStep("idle")} className="rounded-2xl bg-[var(--surface)] px-4 py-2.5 text-sm font-bold transition hover:bg-[var(--surface-strong)]">
            {t("leave", "later")}
          </button>
          <button onClick={handleRepay} className="rounded-2xl bg-gold px-4 py-2.5 text-sm font-bold text-ink transition hover:brightness-110">
            {t("leave", "settleAndLeave")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
