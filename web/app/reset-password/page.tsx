"use client";

import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionPage } from "@/components/ui/motion";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erreur lors de la réinitialisation."); return; }
    setDone(true);
  }

  if (!token) {
    return <p className="text-sm text-rose-300">Lien invalide. Demandez un nouveau lien de réinitialisation.</p>;
  }

  return done ? (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 px-4 py-4 text-sm font-bold text-emerald-200">
        <CheckCircle size={20} /> Mot de passe mis à jour avec succès.
      </div>
      <Link href="/login" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-black text-ink shadow-glow">
        Se connecter <ArrowRight size={16} />
      </Link>
    </div>
  ) : (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <p className="text-sm leading-6 text-smoke">Choisissez un nouveau mot de passe (min. 8 caractères, 1 majuscule, 1 chiffre).</p>
      <Input name="password" type="password" placeholder="Nouveau mot de passe" autoComplete="new-password" required />
      <Input name="confirm" type="password" placeholder="Confirmer le mot de passe" autoComplete="new-password" required />
      {error ? <p className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
      <Button disabled={loading} className="w-full">
        {loading ? "Enregistrement..." : "Enregistrer"} <ArrowRight size={18} />
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <MotionPage>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-ivory">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500 text-ink font-black">K</span>
          Kotizy
        </Link>
        <div className="glass rounded-[1.75rem] p-5">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <Sparkles size={14} /> Sécurité compte
          </p>
          <h1 className="mt-2 text-3xl font-black">Nouveau mot de passe</h1>
          <Suspense fallback={<p className="mt-6 text-sm text-smoke">Chargement...</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </MotionPage>
  );
}
