"use client";

import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionPage } from "@/components/ui/motion";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setLoading(true);
    setError(null);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <MotionPage>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500 text-ink font-black">K</span>
          Kotizy
        </Link>

        <div className="glass rounded-[1.75rem] p-5">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <Sparkles size={14} />
            Récupération de compte
          </p>
          <h1 className="mt-2 text-3xl font-black">Mot de passe oublié</h1>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
                Si un compte existe avec cet email, un lien de réinitialisation vous a été envoyé. Vérifiez vos spams.
              </div>
              <Link href="/login" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-black text-[var(--text)] ring-1 ring-white/10">
                <ArrowLeft size={16} /> Retour connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <p className="text-sm leading-6 text-smoke">Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
              <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
              {error ? <p className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
              <Button disabled={loading} className="w-full">
                {loading ? "Envoi..." : "Envoyer le lien"} <ArrowRight size={18} />
              </Button>
              <Link href="/login" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/5 text-sm font-bold text-smoke">
                <ArrowLeft size={16} /> Retour
              </Link>
            </form>
          )}
        </div>
      </div>
    </MotionPage>
  );
}
