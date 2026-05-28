import { ArrowRight, BadgeCheck, CreditCard, ShieldCheck, Smartphone, Sparkles, Users, TrendingUp, Globe } from "lucide-react";
import React from "react";
import Link from "next/link";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { MotionPage } from "@/components/ui/motion";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <MotionPage>
      <main className="mx-auto min-h-dvh max-w-6xl px-5 py-5">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-lg font-black text-ink shadow-glow">K</span>
            <span className="text-sm font-black tracking-tight">Kotizy</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={session ? (session.role === "ADMIN" ? "/admin" : "/dashboard") : "/login"}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-ivory ring-1 ring-white/10"
            >
              {session ? "Ouvrir" : "Connexion"}
            </Link>
          </div>
        </nav>

        <section className="grid min-h-[calc(100dvh-7rem)] items-center gap-8 py-8 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              <Sparkles size={14} />
              La tontine de votre génération
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-normal md:text-7xl">
              L'épargne collective,<br />réinventée.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-smoke md:text-lg">
              Kotizy digitalise la tontine — cotisations, rotation automatique, wallet multi-devise,
              score de confiance et paiements mobiles. Pour la diaspora et au-delà.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={session ? "/dashboard" : "/register"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-black text-ink shadow-glow"
              >
                {session ? "Mon dashboard" : "Commencer gratuitement"} <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 text-sm font-black text-ivory ring-1 ring-white/10">
                Se connecter
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Multi-devise", Globe],
                ["PWA mobile", Smartphone],
                ["Anti-fraude", ShieldCheck],
                ["Groupes", Users]
              ].map(([label, Icon]) => {
                const I = Icon as React.ElementType;
                return (
                  <div key={String(label)} className="glass rounded-3xl p-4">
                    <I className="mb-3 text-emerald-400" size={20} />
                    <p className="text-sm font-bold">{String(label)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass mx-auto w-full max-w-sm rounded-[2rem] p-4 shadow-premium">
            <div className="rounded-[1.5rem] bg-ink p-4 ring-1 ring-white/10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-smoke">Solde wallet</p>
                  <p className="text-3xl font-black">XOF · EUR · USD</p>
                </div>
                <BadgeCheck className="text-gold" size={30} />
              </div>
              <div className="rounded-3xl bg-emerald-500 p-4 text-ink">
                <p className="text-xs font-bold uppercase">Prochaine échéance</p>
                <p className="mt-2 text-2xl font-black">Cercle Émeraude</p>
                <p className="mt-1 text-sm font-bold">16 devises supportées</p>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Kotisation validée", "text-emerald-400"],
                  ["Wave en attente", "text-gold"],
                  ["Rotation programmée", "text-emerald-400"]
                ].map(([label, cls]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-white/[0.08] p-3">
                    <span className="text-sm font-bold">{String(label)}</span>
                    <span className={String(cls)}>{cls.includes("gold") ? "Review" : "OK"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-16">
          <p className="mb-2 text-center text-xs font-bold uppercase text-smoke">Pourquoi Kotizy ?</p>
          <h2 className="mb-12 text-center text-3xl font-black md:text-4xl">Tout ce dont votre cercle a besoin.</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Cotisations automatiques", "Planifiez, cotisez et suivez les paiements de votre groupe en temps réel.", TrendingUp],
              ["Score de confiance", "Chaque membre est noté sur sa ponctualité. Les mauvais payeurs sont détectés automatiquement.", ShieldCheck],
              ["Multi-devise native", "XOF, EUR, USD, NGN, GHS, KES et 10 autres. Votre diaspora, toutes devises.", Globe],
              ["Paiements mobiles", "Stripe, Wave, Orange Money, MTN MoMo, Flutterwave et virement bancaire.", CreditCard],
              ["Wallet intégré", "Solde personnel, historique complet et paiement en 1 clic depuis le wallet.", Users],
              ["PWA installable", "Fonctionne comme une app native sur Android et iOS. Aucun store requis.", Smartphone]
            ].map(([title, desc, Icon]) => {
              const I = Icon as React.ElementType;
              return (
                <div key={String(title)} className="glass rounded-3xl p-5">
                  <I className="mb-4 text-emerald-400" size={22} />
                  <p className="mb-2 font-black">{String(title)}</p>
                  <p className="text-sm leading-6 text-smoke">{String(desc)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-16 text-center">
          <h2 className="mb-4 text-3xl font-black md:text-4xl">Prêt à kotiser ?</h2>
          <p className="mb-8 text-smoke">Créez votre groupe en 2 minutes. C'est gratuit.</p>
          <Link href="/register" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 text-base font-black text-ink shadow-glow">
            Créer mon compte <ArrowRight size={20} />
          </Link>
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-smoke">
          © {new Date().getFullYear()} Kotizy — L'épargne collective, réinventée.
          {" · "}
          <a href="https://kah-digital.ch/" target="_blank" rel="noopener noreferrer" className="hover:text-ivory transition-colors">
            Un produit KAH Digital
          </a>
        </footer>
      </main>
    </MotionPage>
  );
}
