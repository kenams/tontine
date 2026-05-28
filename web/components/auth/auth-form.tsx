"use client";

import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionPage } from "@/components/ui/motion";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

type Props = {
  mode: "login" | "register";
  admin?: boolean;
};

export function AuthForm({ mode, admin = false }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<"user" | "admin" | null>(null);

  async function quickLogin(role: "user" | "admin") {
    setQuickLoading(role);
    setError(null);
    const creds = role === "admin"
      ? { email: "admin@kotizy.app", password: "Admin123!" }
      : { email: "user@kotizy.app", password: "User123!" };
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds)
    });
    const data = (await res.json()) as { error?: string; redirectTo?: string };
    setQuickLoading(null);
    if (!res.ok) { setError(data.error ?? "Erreur connexion rapide."); return; }
    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    const payload =
      mode === "register"
        ? {
            fullName: String(formData.get("fullName") ?? ""),
            email: String(formData.get("email") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            currency: String(formData.get("currency") ?? "XOF"),
            password: String(formData.get("password") ?? "")
          }
        : {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? "")
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as { error?: string; redirectTo?: string; role?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Action impossible.");
      return;
    }
    router.push(admin ? "/admin" : data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <MotionPage>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-ivory">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500 font-black text-ink">K</span>
          Kotizy
        </Link>

        <div className="glass rounded-[1.75rem] p-5">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                {admin ? <ShieldCheck size={14} /> : <Sparkles size={14} />}
                {admin ? "Backoffice securise" : "Mobile money ready"}
              </p>
              <h1 className="text-3xl font-black tracking-normal">
                {mode === "login" ? "Connexion" : "Creer un compte"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-smoke">
                {admin
                  ? "Acces admin avec RBAC, audit logs et alertes fraude."
                  : "Wallet test, tontines premium et scoring confiance."}
              </p>
            </div>
          </div>

          <form
            onSubmit={submit}
            method="post"
            action={mode === "login" ? "/api/auth/login" : "/api/auth/register"}
            className="space-y-3"
          >
            {mode === "register" ? <Input name="fullName" placeholder="Nom complet" autoComplete="name" required /> : null}
            <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
            {mode === "register" ? <Input name="phone" placeholder="Telephone" autoComplete="tel" /> : null}
            {mode === "register" ? (
              <select
                name="currency"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#050706] px-4 text-sm text-ivory outline-none"
                style={{ colorScheme: "dark" }}
                defaultValue="XOF"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code} className="bg-[#050706] text-ivory">
                    {currency.code} - {currency.label}
                  </option>
                ))}
              </select>
            ) : null}
            <Input name="password" type="password" placeholder="Mot de passe" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
            {mode === "login" ? (
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-smoke hover:text-emerald-400">
                  Mot de passe oublié ?
                </Link>
              </div>
            ) : null}
            {error ? <p className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
            <Button disabled={loading} className="w-full">
              {loading ? "Traitement..." : mode === "login" ? "Entrer" : "Commencer"}
              <ArrowRight size={18} />
            </Button>
          </form>

          {mode === "login" ? (
            <div className="mt-5 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-smoke">
                <Zap size={12} className="text-gold" /> Connexion rapide démo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin("user")}
                  disabled={quickLoading !== null}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/[0.08] text-xs font-bold text-ivory ring-1 ring-white/10 transition hover:bg-white/[0.14] disabled:opacity-50"
                >
                  {quickLoading === "user" ? "..." : "👤 Utilisateur"}
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin("admin")}
                  disabled={quickLoading !== null}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gold/10 text-xs font-bold text-gold ring-1 ring-gold/20 transition hover:bg-gold/20 disabled:opacity-50"
                >
                  {quickLoading === "admin" ? "..." : "🛡️ Admin"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 text-center text-sm text-smoke">
          {mode === "login" ? (
            <>
              Pas de compte ?{" "}
              <Link className="font-bold text-emerald-400" href="/register">
                Inscription
              </Link>
            </>
          ) : (
            <>
              Deja inscrit ?{" "}
              <Link className="font-bold text-emerald-400" href="/login">
                Connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </MotionPage>
  );
}
