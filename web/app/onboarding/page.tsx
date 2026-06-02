"use client";

import { ArrowRight, CheckCircle2, CreditCard, Plus, Smartphone, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STEPS = [
  {
    id: "welcome",
    icon: WalletCards,
    color: "bg-emerald-500 text-[#080b07]",
    title: "Bienvenue sur Kotizy 👋",
    body: "La première plateforme de tontine digitale pour la diaspora. En 3 étapes, tu seras prêt à épargner avec ta famille et tes proches.",
    action: null,
  },
  {
    id: "wallet",
    icon: CreditCard,
    color: "bg-emerald-500/20 text-emerald-400",
    title: "Alimente ton wallet",
    body: "Pour cotiser dans un cercle, tu as besoin de crédit dans ton wallet. Commence avec le montant de ton choix — même 5€ suffit pour débuter.",
    action: { label: "Déposer maintenant", href: "/wallet/deposit", secondary: { label: "Plus tard", href: null } },
  },
  {
    id: "circle",
    icon: Users,
    color: "bg-gold/20 text-gold",
    title: "Crée ou rejoins un cercle",
    body: "Invites tes proches à te rejoindre dans une tontine, ou rejoins un cercle existant avec un code d'invitation.",
    action: { label: "Créer un cercle", href: "/tontines/create", secondary: { label: "Rejoindre un cercle", href: "/tontines" } },
  },
  {
    id: "mobile",
    icon: Smartphone,
    color: "bg-white/10 text-white",
    title: "Télécharge l'app",
    body: "Notifications push, paiements Mobile Money, suivi en temps réel. L'APK Android est disponible gratuitement.",
    action: { label: "Télécharger l'APK", href: "https://github.com/kenams/tontine/releases/download/v2.2.0/kotizy-v2.2.0.apk", secondary: { label: "Ignorer", href: null } },
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  function markDone(i: number) {
    setDone((prev) => new Set([...prev, i]));
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-5 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-base font-black text-[#080b07] shadow-glow">K</span>
          <span className="font-black text-[var(--text)]">Kotizy</span>
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-emerald-500" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Étape */}
        <div className="glass mb-5 rounded-[1.75rem] p-6">
          <div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${current.color}`}>
            <Icon size={24} />
          </div>
          <h2 className="text-2xl font-black">{current.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{current.body}</p>

          {current.action && (
            <div className="mt-5 flex flex-col gap-2">
              {current.action.href?.startsWith("http") ? (
                <a
                  href={current.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { markDone(step); setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 300); }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-[#080b07] shadow-glow transition hover:bg-emerald-400"
                >
                  {current.action.label} <ArrowRight size={15} />
                </a>
              ) : (
                <Link
                  href={current.action.href ?? "#"}
                  onClick={() => markDone(step)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-[#080b07] shadow-glow transition hover:bg-emerald-400"
                >
                  {current.action.label} <ArrowRight size={15} />
                </Link>
              )}
              {current.action.secondary && (
                <button
                  onClick={() => { markDone(step); setStep((s) => Math.min(s + 1, STEPS.length - 1)); }}
                  className="rounded-2xl py-3 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  {current.action.secondary.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Étapes restantes */}
        <div className="mb-5 space-y-2">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isDone = done.has(i);
            const isCurrent = i === step;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${isCurrent ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : "bg-[var(--surface)] hover:bg-[var(--surface-strong)]"}`}
              >
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isDone ? "bg-emerald-500/20" : "bg-white/5"}`}>
                  {isDone
                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                    : <StepIcon size={16} className={isCurrent ? "text-emerald-400" : "text-[var(--muted)]"} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold truncate ${isCurrent ? "text-[var(--text)]" : isDone ? "text-[var(--muted)] line-through" : "text-[var(--muted)]"}`}>{s.title}</p>
                </div>
                {isCurrent && <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Skip / Terminer */}
        {isLast || done.size >= 2 ? (
          <Link href="/dashboard" className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-[#080b07] shadow-glow transition hover:bg-emerald-400">
            Aller sur mon dashboard <ArrowRight size={16} />
          </Link>
        ) : (
          <button onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))} className="w-full rounded-2xl py-3 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--text)]">
            Étape suivante →
          </button>
        )}

        <Link href="/dashboard" className="mt-3 block text-center text-xs text-[var(--muted)] hover:text-[var(--text)]">
          Passer l'onboarding
        </Link>
      </div>
    </div>
  );
}
