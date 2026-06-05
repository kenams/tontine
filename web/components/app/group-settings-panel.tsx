"use client";

import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

type Props = {
  groupId: string;
  current: {
    minTrustScore: number;
    requireFullPayment: boolean;
    autoExcludeDays: number;
    latePenaltyCents: number;
    emergencyFundBps: number;
  };
  currency: string;
};

export function GroupSettingsPanel({ groupId, current, currency }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [vals, setVals] = useState(current);
  const router = useRouter();
  const { t } = useLanguage();

  async function save() {
    setLoading(true);
    setSaved(false);
    await fetch(`/api/tontines/${groupId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vals),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  const SELECT_CLS = "min-h-10 w-full rounded-xl border border-white/10 bg-[var(--bg)] px-3 text-sm text-[var(--text)] outline-none";

  return (
    <div className="glass mb-4 rounded-3xl p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-black"
      >
        <span className="flex items-center gap-2"><Settings size={16} className="text-[var(--muted)]" /> {t("groupSettings", "title")}</span>
        <span className="text-xs text-[var(--muted)]">{open ? t("groupSettings", "close") : t("groupSettings", "edit")}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-[var(--muted)]">{t("groupSettings", "minTrustLabel")}</label>
            <select className={SELECT_CLS} value={vals.minTrustScore} onChange={(e) => setVals({ ...vals, minTrustScore: Number(e.target.value) })} style={{ colorScheme: "dark" }}>
              <option value={0}>{t("groupSettings", "minTrustNone")}</option>
              <option value={30}>{t("groupSettings", "minTrust30")}</option>
              <option value={50}>{t("groupSettings", "minTrust50")}</option>
              <option value={70}>{t("groupSettings", "minTrust70")}</option>
              <option value={85}>{t("groupSettings", "minTrust85")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-[var(--muted)]">{t("groupSettings", "autoExcludeLabel")}</label>
            <select className={SELECT_CLS} value={vals.autoExcludeDays} onChange={(e) => setVals({ ...vals, autoExcludeDays: Number(e.target.value) })} style={{ colorScheme: "dark" }}>
              <option value={14}>{t("groupSettings", "days14")}</option>
              <option value={21}>{t("groupSettings", "days21")}</option>
              <option value={30}>{t("groupSettings", "days30")}</option>
              <option value={45}>{t("groupSettings", "days45")}</option>
              <option value={60}>{t("groupSettings", "days60")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-[var(--muted)]">
              {t("groupSettings", "penaltyLabel")} ({currency})
            </label>
            <select className={SELECT_CLS} value={vals.latePenaltyCents} onChange={(e) => setVals({ ...vals, latePenaltyCents: Number(e.target.value) })} style={{ colorScheme: "dark" }}>
              <option value={0}>{t("groupSettings", "noPenalty")}</option>
              <option value={500}>{currency === "XOF" ? "500 XOF" : "5 €"}</option>
              <option value={1000}>{currency === "XOF" ? "1 000 XOF" : "10 €"}</option>
              <option value={2000}>{currency === "XOF" ? "2 000 XOF" : "20 €"}</option>
              <option value={5000}>{currency === "XOF" ? "5 000 XOF" : "50 €"}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-[var(--muted)]">
              {t("groupSettings", "emergencyLabel")}
            </label>
            <select className={SELECT_CLS} value={vals.emergencyFundBps} onChange={(e) => setVals({ ...vals, emergencyFundBps: Number(e.target.value) })} style={{ colorScheme: "dark" }}>
              <option value={0}>{t("groupSettings", "emergency0")}</option>
              <option value={250}>{t("groupSettings", "emergency25")}</option>
              <option value={500}>{t("groupSettings", "emergency5")}</option>
              <option value={750}>{t("groupSettings", "emergency75")}</option>
              <option value={1000}>{t("groupSettings", "emergency10")}</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
              checked={vals.requireFullPayment}
              onChange={(e) => setVals({ ...vals, requireFullPayment: e.target.checked })}
            />
            <div>
              <p className="text-xs font-bold">{t("groupSettings", "blockCycleLabel")}</p>
              <p className="text-[11px] text-[var(--muted)]">{t("groupSettings", "blockCycleHint")}</p>
            </div>
          </label>

          <button
            onClick={save}
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-black text-ink shadow-glow transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saved ? t("groupSettings", "saved") : loading ? "..." : t("groupSettings", "btnSave")}
          </button>
        </div>
      )}
    </div>
  );
}
