"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n/context";

const SELECT_CLS = "min-h-12 w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-emerald-400/60";

export function CreateTontineForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const rules = String(fd.get("rules") ?? "").trim();
    const contribution = Number(fd.get("contribution"));
    const maxMembers = Number(fd.get("maxMembers") ?? 8);
    if (!name) { setError(t("createTontine", "errName") || "Le nom du groupe est requis."); return; }
    if (!description) { setError(t("createTontine", "errDesc") || "L'objectif du groupe est requis."); return; }
    if (!rules) { setError(t("createTontine", "errRules") || "Les règles du groupe sont requises."); return; }
    if (!contribution || contribution < 1) { setError(t("createTontine", "errContrib") || "La cotisation doit être supérieure à 0."); return; }
    if (maxMembers < 3 || maxMembers > 30) { setError(t("createTontine", "errMembers") || "Nombre de membres entre 3 et 30."); return; }
    setLoading(true);
    setError(null);
    const response = await fetch("/api/tontines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") ?? ""),
        description: String(fd.get("description") ?? ""),
        contributionAmount: Number(fd.get("contribution")),
        currency: String(fd.get("currency") ?? "EUR"),
        frequency: String(fd.get("frequency") ?? "MONTHLY"),
        maxMembers: Number(fd.get("maxMembers") ?? 8),
        rules: String(fd.get("rules") ?? ""),
        minTrustScore: Number(fd.get("minTrustScore") ?? 0),
        requireFullPayment: fd.get("requireFullPayment") === "on",
        autoExcludeDays: Number(fd.get("autoExcludeDays") ?? 30),
      }),
    });
    const data = (await response.json()) as { error?: string; group?: { id: string } };
    setLoading(false);
    if (!response.ok || !data.group) { setError(data.error ?? t("createTontine", "errCreation")); return; }
    router.push(`/tontines/${data.group.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <Input name="name" placeholder={t("createTontine", "nameLabel")} required />
      <Textarea name="description" placeholder={t("createTontine", "descLabel")} required />

      <div className="grid grid-cols-2 gap-3">
        <Input name="contribution" type="number" min={1} step="0.01" defaultValue={100} placeholder={t("createTontine", "contribLabel")} required />
        <Input name="maxMembers" type="number" min={3} max={30} defaultValue={8} placeholder={t("createTontine", "membersLabel")} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select name="currency" className={SELECT_CLS} defaultValue="EUR" style={{ colorScheme: "dark" }}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
          ))}
        </select>
        <select name="frequency" className={SELECT_CLS} defaultValue="MONTHLY" style={{ colorScheme: "dark" }}>
          <option value="WEEKLY">{t("createTontine", "weekly")}</option>
          <option value="BIWEEKLY">{t("createTontine", "biweekly")}</option>
          <option value="MONTHLY">{t("createTontine", "monthly")}</option>
        </select>
      </div>

      <Textarea name="rules" placeholder={t("createTontine", "rulesLabel")} required />

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--surface-strong)]"
      >
        {t("createTontine", "advanced")}
        <ChevronDown size={15} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-3xl bg-[var(--surface)] p-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
              {t("createTontine", "minTrustLabel")}
            </label>
            <select name="minTrustScore" className={SELECT_CLS} defaultValue="0" style={{ colorScheme: "dark" }}>
              <option value="0">{t("createTontine", "minTrustNone")}</option>
              <option value="30">{t("createTontine", "minTrust30")}</option>
              <option value="50">{t("createTontine", "minTrust50")}</option>
              <option value="70">{t("createTontine", "minTrust70")}</option>
              <option value="85">{t("createTontine", "minTrust85")}</option>
            </select>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{t("createTontine", "minTrustHint")}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
              {t("createTontine", "autoExcludeLabel")}
            </label>
            <select name="autoExcludeDays" className={SELECT_CLS} defaultValue="30" style={{ colorScheme: "dark" }}>
              <option value="14">{t("createTontine", "days14")}</option>
              <option value="21">{t("createTontine", "days21")}</option>
              <option value="30">{t("createTontine", "days30")}</option>
              <option value="45">{t("createTontine", "days45")}</option>
              <option value="60">{t("createTontine", "days60")}</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--bg)] px-4 py-3">
            <input type="checkbox" name="requireFullPayment" className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500" />
            <div>
              <p className="text-sm font-bold">{t("createTontine", "blockCycleLabel")}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">{t("createTontine", "blockCycleHint")}</p>
            </div>
          </label>
        </div>
      )}

      {error && <p className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <Button disabled={loading} className="w-full">
        {loading ? t("createTontine", "btnCreating") : t("createTontine", "btnCreate")}
        <ArrowRight size={18} />
      </Button>
    </form>
  );
}
