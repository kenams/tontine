"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export function CreateTontineForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    const response = await fetch("/api/tontines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        contributionAmount: Number(formData.get("contribution")),
        currency: String(formData.get("currency") ?? "XOF"),
        frequency: String(formData.get("frequency") ?? "MONTHLY"),
        maxMembers: Number(formData.get("maxMembers") ?? 8),
        rules: String(formData.get("rules") ?? "")
      })
    });
    const data = (await response.json()) as { error?: string; group?: { id: string } };
    setLoading(false);
    if (!response.ok || !data.group) {
      setError(data.error ?? "Creation impossible.");
      return;
    }
    router.push(`/tontines/${data.group.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input name="name" placeholder="Nom du groupe" required />
      <Textarea name="description" placeholder="Objectif du groupe" required />
      <div className="grid grid-cols-2 gap-3">
        <Input name="contribution" type="number" min={1} step="0.01" defaultValue={50000} placeholder="Montant" required />
        <Input name="maxMembers" type="number" min={3} max={30} defaultValue={8} placeholder="Membres" required />
      </div>
      <select
        name="currency"
        className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-sm outline-none"
        defaultValue="EUR"
        style={{ colorScheme: "dark" }}
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} — {currency.label}
          </option>
        ))}
      </select>
      <select
        name="frequency"
        className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-sm outline-none"
        defaultValue="MONTHLY"
        style={{ colorScheme: "dark" }}
      >
        <option value="WEEKLY">Hebdomadaire</option>
        <option value="BIWEEKLY">Toutes les 2 semaines</option>
        <option value="MONTHLY">Mensuelle</option>
      </select>
      <Textarea name="rules" placeholder="Regles: echeance, penalites, votes, fonds urgence..." required />
      {error ? <p className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
      <Button disabled={loading} className="w-full">
        {loading ? "Creation..." : "Creer la tontine"}
        <ArrowRight size={18} />
      </Button>
    </form>
  );
}
