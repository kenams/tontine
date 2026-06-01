"use client";

import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

export function AutoPayToggle({
  groupId, initialEnabled, walletBalance, contributionCents, currency,
}: {
  groupId: string; initialEnabled: boolean; walletBalance: number;
  contributionCents: number; currency: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { t } = useLanguage();

  const insufficient = walletBalance < contributionCents;

  async function toggle() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/tontines/${groupId}/autopay`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (res.ok) {
      setEnabled(data.autoPayEnabled);
      setMsg(data.autoPayEnabled ? t("autoPay", "activated") : t("autoPay", "deactivated"));
    }
  }

  return (
    <div className={`glass rounded-3xl p-4 ${enabled ? "ring-1 ring-emerald-400/30" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${enabled ? "bg-emerald-500/15" : "bg-white/10"}`}>
          <Zap size={18} className={enabled ? "text-emerald-400" : "text-[var(--muted)]"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm">{t("autoPay", "title")}</p>
          <p className="text-xs text-[var(--muted)]">
            {enabled ? t("autoPay", "enabledDesc") : t("autoPay", "disabledDesc")}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          aria-pressed={enabled}
          className={`relative h-7 w-12 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-white/20"} disabled:opacity-50`}
        >
          {loading
            ? <Loader2 size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
            : <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
          }
        </button>
      </div>
      {enabled && insufficient && (
        <div className="mt-3 rounded-2xl border border-gold/20 bg-gold/8 px-3 py-2 text-xs text-gold">
          {t("autoPay", "insufficientWarn")}{" "}
          <a href="/wallet/deposit" className="underline font-bold">{t("autoPay", "recharge")}</a>
        </div>
      )}
      {msg && <p className="mt-2 text-xs text-emerald-400">{msg}</p>}
    </div>
  );
}
