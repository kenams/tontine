"use client";

import { ArrowRight, CheckCircle, Eye, EyeOff, Lock, ShieldCheck, Sparkles, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionPage } from "@/components/ui/motion";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

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
    { ok: password.length >= 8, label: "8 caractères minimum" },
    { ok: /[A-Z]/.test(password), label: "1 lettre majuscule" },
    { ok: /[0-9]/.test(password), label: "1 chiffre" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "1 caractère spécial (recommandé)" }
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
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.ok
              ? <CheckCircle size={12} className="shrink-0 text-emerald-400" />
              : <XCircle size={12} className="shrink-0 text-[var(--muted)]" />}
            <span className={`text-[11px] ${c.ok ? "text-emerald-400" : "text-[var(--muted)]"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordInput({
  name, placeholder, autoComplete, onChange
}: {
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

  // Récupère le paramètre ?next= pour rediriger après connexion (ex: depuis /g/[code])
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
        body: JSON.stringify(creds)
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
      const confirm = String(fd.get("confirm") ?? "");
      if (pwd !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
      if (passwordScore(pwd) < 3) { setError("Mot de passe trop faible. Ajoutez une majuscule et un chiffre."); return; }
    }

    setLoading(true);
    try {
      const payload = mode === "register"
        ? {
            fullName: String(fd.get("fullName") ?? ""),
            email: String(fd.get("email") ?? ""),
            phone: String(fd.get("phone") ?? ""),
            currency: String(fd.get("currency") ?? "XOF"),
            password: String(fd.get("password") ?? "")
          }
        : {
            email: String(fd.get("email") ?? ""),
            password: String(fd.get("password") ?? "")
          };

      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data: { error?: string; redirectTo?: string; role?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON 500 */ }

      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}. Veuillez réessayer.`);
        return;
      }
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
              {admin ? "Backoffice sécurisé" : mode === "register" ? "Compte sécurisé" : "Mobile money ready"}
            </p>
            <h1 className="text-3xl font-black">
              {mode === "login" ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {admin
                ? "Accès admin avec RBAC, audit logs et alertes fraude."
                : mode === "register"
                  ? "Vos données et transactions sont chiffrées et sécurisées."
                  : "Wallet, tontines et score de confiance."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <Input name="fullName" placeholder="Nom complet" autoComplete="name" required />
            )}
            <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
            {mode === "register" && (
              <Input name="phone" placeholder="Téléphone (optionnel)" autoComplete="tel" />
            )}
            {mode === "register" && (
              <select
                name="currency"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-emerald-400/60 light:border-ink/15"
                defaultValue="XOF"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[var(--bg)] text-[var(--text)]">
                    {c.code} — {c.label}
                  </option>
                ))}
              </select>
            )}

            <PasswordInput
              name="password"
              placeholder="Mot de passe"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onChange={mode === "register" ? setPassword : undefined}
            />

            {mode === "register" && (
              <>
                <PasswordStrength password={password} />
                <PasswordInput name="confirm" placeholder="Confirmer le mot de passe" autoComplete="new-password" />
              </>
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
              {loading ? "Traitement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
              <ArrowRight size={18} />
            </Button>
          </form>

          {mode === "register" && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]">
              <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
              Mot de passe chiffré bcrypt · Sessions HMAC-SHA256 · Rate limiting actif
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
            <>Pas de compte ?{" "}<Link className="font-bold text-emerald-400" href="/register">Inscription</Link></>
          ) : (
            <>Déjà inscrit ?{" "}<Link className="font-bold text-emerald-400" href="/login">Connexion</Link></>
          )}
        </div>
      </div>
    </MotionPage>
  );
}
