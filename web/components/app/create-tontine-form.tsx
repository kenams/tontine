"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const SELECT_CLS = "min-h-12 w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-emerald-400/60";

export function CreateTontineForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
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
    if (!response.ok || !data.group) { setError(data.error ?? "Création impossible."); return; }
    router.push(`/tontines/${data.group.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input name="name" placeholder="Nom du groupe (ex: Cercle Famille 2026)" required />
      <Textarea name="description" placeholder="Objectif du groupe" required />

      <div className="grid grid-cols-2 gap-3">
        <Input name="contribution" type="number" min={1} step="0.01" defaultValue={100} placeholder="Cotisation" required />
        <Input name="maxMembers" type="number" min={3} max={30} defaultValue={8} placeholder="Membres max" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select name="currency" className={SELECT_CLS} defaultValue="EUR" style={{ colorScheme: "dark" }}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
          ))}
        </select>
        <select name="frequency" className={SELECT_CLS} defaultValue="MONTHLY" style={{ colorScheme: "dark" }}>
          <option value="WEEKLY">Hebdomadaire</option>
          <option value="BIWEEKLY">Bi-mensuelle</option>
          <option value="MONTHLY">Mensuelle</option>
        </select>
      </div>

      <Textarea name="rules" placeholder="Règles : pénalités, ordre de passage, conditions de sortie..." required />

      {/* Paramètres avancés */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--surface-strong)]"
      >
        Paramètres avancés
        <ChevronDown size={15} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-3xl bg-[var(--surface)] p-4">
          {/* Score minimum pour rejoindre */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
              Score de confiance minimum pour rejoindre
            </label>
            <select name="minTrustScore" className={SELECT_CLS} defaultValue="0" style={{ colorScheme: "dark" }}>
              <option value="0">Aucun (ouvert à tous)</option>
              <option value="30">30+ — Bronze minimum</option>
              <option value="50">50+ — Intermédiaire</option>
              <option value="70">70+ — Avancé</option>
              <option value="85">85+ — Gold (cercle premium)</option>
            </select>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Filtre les membres selon leur historique de paiement.</p>
          </div>

          {/* Exclusion automatique */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
              Exclusion automatique après (jours sans paiement)
            </label>
            <select name="autoExcludeDays" className={SELECT_CLS} defaultValue="30" style={{ colorScheme: "dark" }}>
              <option value="14">14 jours</option>
              <option value="21">21 jours</option>
              <option value="30">30 jours (recommandé)</option>
              <option value="45">45 jours</option>
              <option value="60">60 jours</option>
            </select>
          </div>

          {/* Paiement complet requis */}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--bg)] px-4 py-3">
            <input type="checkbox" name="requireFullPayment" className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500" />
            <div>
              <p className="text-sm font-bold">Bloquer le cycle si paiement incomplet</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Le round n'avance pas tant que tous les membres actifs n'ont pas cotisé (ou que le fonds d'urgence n'a pas comblé les retards).
              </p>
            </div>
          </label>
        </div>
      )}

      {error && <p className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <Button disabled={loading} className="w-full">
        {loading ? "Création..." : "Créer le groupe"}
        <ArrowRight size={18} />
      </Button>
    </form>
  );
}
