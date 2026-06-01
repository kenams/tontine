"use client";

import { ArrowRight, CheckCircle, Eye, EyeOff, Lock, ShieldCheck, Sparkles, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionPage } from "@/components/ui/motion";

type Props = { mode: "login" | "register"; admin?: boolean };

function passwordScore(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const scoreLabel = ["", "Trop court", "Faible", "Moyen", "Fort", "Très fort"];
const scoreColor = ["", "bg-rose-500", "bg-orange-400", "bg-gold", "bg-emerald-400", "bg-emerald-500"];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  const checks = [
    { ok: password.length >= 8, label: "8 caractères min." },
    { ok: /[A-Z]/.test(password), label: "1 majuscule" },
    { ok: /[0-9]/.test(password), label: "1 chiffre" },
  ];
  return (
    <div className="space-y-2 rounded-2xl bg-[var(--surface)] px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? scoreColor[score] : "bg-white/10"}`} />
          ))}
        </div>
        <span className="text-[11px] font-bold text-[var(--muted)]">{scoreLabel[score] ?? ""}</span>
      </div>
      <div className="flex gap-3">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1">
            {c.ok
              ? <CheckCircle size={11} className="shrink-0 text-emerald-400" />
              : <XCircle size={11} className="shrink-0 text-[var(--muted)]" />}
            <span className={`text-[10px] ${c.ok ? "text-emerald-400" : "text-[var(--muted)]"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordInput({ name, placeholder, autoComplete, onChange }: {
  name: string; placeholder: string; autoComplete: string; onChange?: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="pr-12"
        onChange={(e) => onChange?.(e.target.value)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
        aria-label={show ? "Masquer" : "Afficher"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function AuthForm({ mode, admin = false }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<"user" | "admin" | null>(null);
  const [password, setPassword] = useState("");

  const nextUrl = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("next") ?? ""
    : "";

  async function quickLogin(role: "user" | "admin") {
    setQuickLoading(role);
    setError(null);
    const creds = role === "admin"
      ? { email: "admin@kotizy.app", password: "Admin123!" }
      : { email: "user@kotizy.app", password: "User123!" };
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json() as { error?: string; redirectTo?: string };
      if (!res.ok) { setError(data.error ?? "Erreur connexion rapide."); return; }
      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setQuickLoading(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setError(null);

    if (mode === "register") {
      const pwd = String(fd.get("password") ?? "");
      if (passwordScore(pwd) < 3) { setError("Mot de passe trop faible. Ajoutez une majuscule et un chiffre."); return; }
    }

    setLoading(true);
    try {
      const payload = mode === "register"
        ? {
            fullName: String(fd.get("fullName") ?? ""),
            email: String(fd.get("email") ?? ""),
            password: String(fd.get("password") ?? ""),
            currency: "EUR",
          }
        : {
            email: String(fd.get("email") ?? ""),
            password: String(fd.get("password") ?? ""),
          };

      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { error?: string; redirectTo?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON */ }

      if (!res.ok) { setError(data.error ?? `Erreur ${res.status}. Veuillez réessayer.`); return; }
      const dest = nextUrl || (admin ? "/admin" : data.redirectTo ?? "/dashboard");
      router.push(dest);
      router.refresh();
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MotionPage>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500 font-black text-ink">K</span>
          Kotizy
        </Link>

        <div className="glass rounded-[1.75rem] p-5">
          <div className="mb-6">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              {admin ? <ShieldCheck size={14} /> : mode === "register" ? <Lock size={14} /> : <Sparkles size={14} />}
              {admin ? "Backoffice sécurisé" : mode === "register" ? "Inscription en 30 secondes" : "Mobile money ready"}
            </p>
            <h1 className="text-3xl font-black">
              {mode === "login" ? "Connexion" : "Créer mon compte"}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {admin
                ? "Accès admin avec RBAC et audit logs."
                : mode === "register"
                  ? "Rejoignez le cercle. Gratuit, sans CB."
                  : "Wallet, tontines et score de confiance."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <Input name="fullName" placeholder="Votre prénom et nom" autoComplete="name" required />
            )}
            <Input name="email" type="email" placeholder="Adresse email" autoComplete="email" required />
            <PasswordInput
              name="password"
              placeholder="Mot de passe"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onChange={mode === "register" ? setPassword : undefined}
            />
            {mode === "register" && <PasswordStrength password={password} />}

            {mode === "register" && (
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[var(--surface)] px-4 py-3 cursor-pointer">
                <input type="checkbox" name="cgu" required className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500" />
                <span className="text-xs text-[var(--muted)] leading-relaxed">
                  J'accepte les{" "}
                  <Link href="/legal/cgu" target="_blank" className="text-emerald-400 hover:underline font-bold">CGU</Link>
                  {" "}et la{" "}
                  <Link href="/legal/confidentialite" target="_blank" className="text-emerald-400 hover:underline font-bold">politique de confidentialité</Link>.
                  {" "}18 ans minimum.
                </span>
              </label>
            )}

            {mode === "login" && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-[var(--muted)] hover:text-emerald-400 transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-2xl bg-rose-500/10 px-4 py-3">
                <XCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            <Button disabled={loading} className="w-full">
              {loading ? "Traitement..." : mode === "login" ? "Se connecter" : "Rejoindre le cercle"}
              <ArrowRight size={18} />
            </Button>
          </form>

          {mode === "register" && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]">
              <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
              Gratuit · Sans CB · Données chiffrées · Résiliable à tout moment
            </p>
          )}

          {mode === "login" && (
            <div className="mt-5 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted)]">
                <Zap size={12} className="text-gold" /> Connexion rapide démo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin("user")}
                  disabled={quickLoading !== null}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--surface)] text-xs font-bold text-[var(--text)] ring-1 ring-[var(--surface-strong)] transition hover:bg-[var(--surface-strong)] disabled:opacity-50"
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
          )}
        </div>

        <div className="mt-5 text-center text-sm text-[var(--muted)]">
          {mode === "login" ? (
            <>Pas de compte ?{" "}<Link className="font-bold text-emerald-400" href="/register">Inscription gratuite</Link></>
          ) : (
            <>Déjà inscrit ?{" "}<Link className="font-bold text-emerald-400" href="/login">Connexion</Link></>
          )}
        </div>
      </div>
    </MotionPage>
  );
}
