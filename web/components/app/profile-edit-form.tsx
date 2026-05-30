"use client";

import { Check, Loader2, Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileEditForm({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setError(data?.error ?? "Erreur"); return; }
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!editing) {
    return (
      <div className="glass mb-4 rounded-[1.75rem] p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black">Informations</p>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/15 transition"
          >
            <Pencil size={11} /> Modifier
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Nom</span>
            <span className="font-bold">{fullName}</span>
          </div>
          {phone && (
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Téléphone</span>
              <span className="font-bold">{phone}</span>
            </div>
          )}
        </div>
        {saved && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
            <Check size={14} /> Profil mis à jour
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass mb-4 rounded-[1.75rem] p-5">
      <p className="mb-4 text-sm font-black">Modifier le profil</p>

      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Nom complet</label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Prénom Nom"
          minLength={2} maxLength={80}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">Téléphone (optionnel)</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+33 6 00 00 00 00"
          type="tel"
        />
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <Button onClick={save} disabled={loading || !fullName.trim()} className="flex-1">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Enregistrer
        </Button>
        <button
          onClick={() => { setEditing(false); setFullName(initialName); setPhone(initialPhone ?? ""); setError(null); }}
          className="rounded-2xl bg-white/10 px-4 text-sm font-bold hover:bg-white/15 transition"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
