"use client";

import { ArrowRight, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinTontineForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    const response = await fetch("/api/tontines/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: String(formData.get("joinCode") ?? "") })
    });
    const data = (await response.json()) as { error?: string; groupId?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Code invalide.");
      return;
    }
    router.push(`/tontines/${data.groupId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="glass rounded-3xl p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black">
        <ScanLine size={18} className="text-emerald-400" />
        Rejoindre un groupe
      </div>
      <div className="flex gap-2">
        <Input name="joinCode" placeholder="Code ex: EMERAUDE8" className="uppercase" required />
        <Button disabled={loading} className="shrink-0 rounded-2xl px-3" aria-label="Rejoindre">
          <ArrowRight size={18} />
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
    </form>
  );
}
