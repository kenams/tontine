"use client";

import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
        <span className="flex items-center gap-2"><Settings size={16} className="text-[var(--muted)]" /> Paramètres admin</span>
        <span className="text-xs text-[var(--muted)]">{open ? "Fermer" : "Modifier"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-[var(--muted)]">Score min. pour rejoindre</label>
            <select className={SELECT_CLS} value={vals.minTrustScore} onChange={(e) => setVals({ ...vals, minTrustScore: Number(e.target.value) })} style={{ colorScheme: "dark" }}>
              <option value={0}>Aucun</option>
              <option value={30}>30+ Bronze</option>
              <option value={50}>50+ Intermédiaire</option>
              <option value={70}>70+ Avancé</option>
              <option value={85}>85+ Gold</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-[var(--muted)]">Exclusion automatique</label>
            <select className={SELECT_CLS} value={vals.autoExcludeDays} onChange={(e) => setVals({ ...vals, autoExcludeDays: Number(e.target.value) })} style={{ colorScheme: "dark" }}>
              <option value={14}>14 jours</option>
              <option value={21}>21 jours</option>
              <option value={30}>30 jours</option>
              <option value={45}>45 jours</option>
              <option value={60}>60 jours</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-[var(--muted)]">
              Pénalité retard ({currency})
            </label>
            <select className={SELECT_CLS} value={vals.latePenaltyCents} onChange={(e) => setVals({ ...vals, latePenaltyCents: Number(e.target.value) })} style={{ colorScheme: "dark" }}>
              <option value={0}>Aucune</option>
              <option value={500}>5 {currency === "XOF" ? "500 XOF" : "€5"}</option>
              <option value={1000}>1 000 cts (10€)</option>
              <option value={2000}>2 000 cts (20€)</option>
              <option value={5000}>5 000 cts (50€)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-[var(--muted)]">
              Fonds urgence (% de chaque cotisation)
            </label>
            <select className={SELECT_CLS} value={vals.emergencyFundBps} onChange={(e) => setVals({ ...vals, emergencyFundBps: Number(e.target.value) })} style={{ colorScheme: "dark" }}>
              <option value={0}>0% (désactivé)</option>
              <option value={250}>2,5%</option>
              <option value={500}>5% (recommandé)</option>
              <option value={750}>7,5%</option>
              <option value={1000}>10%</option>
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
              <p className="text-xs font-bold">Bloquer cycle si paiement incomplet</p>
              <p className="text-[11px] text-[var(--muted)]">Round bloqué jusqu'à ce que tous aient payé.</p>
            </div>
          </label>

          <button
            onClick={save}
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-black text-ink shadow-glow transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {saved ? "✓ Sauvegardé" : loading ? "..." : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}
