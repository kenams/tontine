"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/app/mobile-shell";

const ORG_TYPES = [
  { value: "ASSOCIATION", label: "Association" },
  { value: "CHURCH", label: "Église" },
  { value: "MOSQUE", label: "Mosquée" },
  { value: "COMPANY", label: "Entreprise" },
  { value: "COMMUNITY", label: "Communauté" },
];

export default function CreateOrgPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", type: "ASSOCIATION", description: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) { setError("Nom requis."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { org?: { id: string }; error?: string };
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      router.push(`/org/${data.org!.id}`);
    } finally { setLoading(false); }
  };

  return (
    <MobileShell title="Créer une organisation">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">B2B</p>
        <h1 className="text-2xl font-black">Nouvelle organisation</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-bold">Nom de l&apos;organisation *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Association des Ivoiriens de Paris"
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {ORG_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className={`rounded-xl border py-2.5 text-sm font-bold transition ${form.type === t.value ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-[var(--card-border)] text-[var(--muted)]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold">Description <span className="font-normal text-[var(--muted)]">(optionnel)</span></label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Présentez votre organisation..."
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none resize-none"
          />
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <p className="font-black text-emerald-400">Revenus automatiques</p>
          <p className="text-[var(--muted)]">Kotizy reverse <strong className="text-white">0.25%</strong> de chaque pot distribué dans vos tontines directement sur votre wallet.</p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-500 py-3.5 font-black text-ink disabled:opacity-50 transition hover:bg-emerald-400"
        >
          {loading ? "Création..." : "Créer l'organisation"}
        </button>
      </div>
    </MobileShell>
  );
}
