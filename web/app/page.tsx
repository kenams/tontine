import { ArrowRight, BadgeCheck, Globe, Shield, Smartphone, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
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

        {/* ── NAV ── */}
        <nav className="flex items-center justify-between py-2">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-base font-black text-ink shadow-glow">K</span>
            <span className="text-sm font-black tracking-tight">Kotizy</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={session ? (session.role === "ADMIN" ? "/admin" : "/dashboard") : "/login"}
              className="rounded-2xl bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--text)] ring-1 ring-[var(--surface-strong)] transition hover:bg-[var(--surface-strong)]"
            >
              {session ? "Mon espace" : "Connexion"}
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="grid min-h-[calc(100dvh-6rem)] items-center gap-12 py-12 lg:grid-cols-[1fr_440px]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-4 py-2 text-xs font-bold text-emerald-400">
              <Sparkles size={13} />
              La tontine de votre génération
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.03em] md:text-[72px]">
              L'épargne<br />
              <span className="text-emerald-400">collective,</span><br />
              réinventée.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] md:text-lg">
              Tontines digitales multi-devises, wallet sécurisé, score de confiance et paiements mobiles.
              Pour la diaspora africaine et au-delà.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={session ? "/dashboard" : "/register"}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-black text-ink shadow-glow transition hover:bg-emerald-400"
              >
                {session ? "Mon dashboard" : "Commencer gratuitement"}
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--surface)] px-6 text-sm font-bold text-[var(--text)] ring-1 ring-[var(--surface-strong)] transition hover:bg-[var(--surface-strong)]">
                Se connecter
              </Link>
            </div>

            {/* Chiffres */}
            <div className="mt-10 flex flex-wrap gap-8">
              {[["16", "devises"], ["100%", "chiffré"], ["0€", "frais cachés"]].map(([v, l]) => (
                <div key={l}>
                  <p className="text-2xl font-black text-[var(--text)]">{v}</p>
                  <p className="text-xs text-[var(--muted)]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card preview */}
          <div className="mx-auto w-full max-w-sm">
            <div className="glass rounded-[2rem] p-5 shadow-premium">
              {/* Mini wallet card */}
              <div className="kotizy-card mb-4 rounded-[1.5rem] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">Kotizy Wallet</p>
                    <p className="mt-1 text-3xl font-black text-ivory">0 XOF</p>
                  </div>
                  <BadgeCheck className="text-gold" size={24} />
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <p className="font-bold tracking-[0.15em] text-smoke">•••• 2026</p>
                  <p className="text-xs text-smoke">XOF · EUR · USD</p>
                </div>
              </div>

              {/* Feed live */}
              <div className="space-y-2">
                {[
                  { label: "Cotisation validée", sub: "Cercle Émeraude", val: "+50 000", color: "text-emerald-400" },
                  { label: "Badge Ponctuel", sub: "Récompense obtenue", val: "★", color: "text-gold" },
                  { label: "Prochaine échéance", sub: "dans 4 jours", val: "J-4", color: "text-rose-300" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-[var(--surface)] px-3 py-2.5">
                    <div>
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[10px] text-[var(--muted)]">{item.sub}</p>
                    </div>
                    <span className={`text-xs font-black ${item.color}`}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="border-t border-[var(--surface-strong)] py-20">
          <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Pourquoi Kotizy</div>
          <h2 className="mb-14 text-center text-3xl font-black tracking-tight md:text-4xl">
            Tout ce dont votre<br />cercle a besoin.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: TrendingUp, title: "Cotisations automatiques", desc: "Planifiez, cotisez et suivez les paiements de votre groupe en temps réel. Score de confiance calculé automatiquement.", accent: true },
              { icon: Shield, title: "Score de confiance", desc: "Chaque paiement à l'heure renforce votre réputation. Débutant → Bronze → Avancé → Gold → Élite.", accent: false },
              { icon: Globe, title: "16 devises natives", desc: "XOF, EUR, USD, NGN, GHS, KES et 10 autres. Votre diaspora, toutes devises, sans conversion.", accent: false },
              { icon: Zap, title: "Paiements mobiles", desc: "Wallet intégré, Stripe, Wave, Orange Money, MTN MoMo, Flutterwave. Payer en 1 clic.", accent: false },
              { icon: Users, title: "Partage viral", desc: "Chaque groupe a une page publique. Partagez le lien, les membres rejoignent sans compte au préalable.", accent: false },
              { icon: Smartphone, title: "PWA installable", desc: "Fonctionne comme une app native sur Android et iOS. Aucun App Store requis.", accent: false },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div key={title} className={`glass rounded-3xl p-6 transition hover:bg-[var(--surface-strong)] ${accent ? "ring-1 ring-emerald-400/20" : ""}`}>
                <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${accent ? "bg-emerald-500 text-ink shadow-glow" : "bg-[var(--surface-strong)] text-emerald-400"}`}>
                  <Icon size={20} />
                </div>
                <p className="mb-2 font-black">{title}</p>
                <p className="text-sm leading-6 text-[var(--muted)]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-20 text-center">
          <h2 className="mb-3 text-4xl font-black tracking-tight md:text-5xl">Prêt à kotiser ?</h2>
          <p className="mb-8 text-[var(--muted)]">Créez votre groupe en 2 minutes. C'est gratuit.</p>
          <Link href="/register" className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-emerald-500 px-10 text-base font-black text-ink shadow-glow transition hover:bg-emerald-400">
            Créer mon compte <ArrowRight size={20} />
          </Link>
        </section>

        {/* ── FOOTER ── */}
        <footer className="flex items-center justify-between border-t border-[var(--surface-strong)] py-8 text-xs text-[var(--muted)]">
          <span>© {new Date().getFullYear()} Kotizy</span>
          <a href="https://kah-digital.ch/" target="_blank" rel="noopener noreferrer" className="transition hover:text-[var(--text)]">
            Un produit KAH Digital
          </a>
        </footer>
      </main>
    </MotionPage>
  );
}
