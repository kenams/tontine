import {
  ArrowRight, BadgeCheck, ChevronDown, Download,
  Globe, MessageCircle, Shield, Smartphone,
  Sparkles, Star, TrendingUp, Users, Zap,
} from "lucide-react";
import { GEM_TIERS } from "@/lib/tiers";
import Link from "next/link";

import { AnimatedCounter } from "@/components/app/landing-counter";
import { LangToggle } from "@/components/app/lang-toggle";
import { MotionPage } from "@/components/ui/motion";
import { getSession } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

export const revalidate = 60;

const getStats = unstable_cache(async () => {
  const [userCount, groupCount, txCount] = await Promise.all([
    prisma.user.count(),
    prisma.tontineGroup.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count({ where: { status: "PAID" } }),
  ]).catch(() => [0, 0, 0]);
  return { userCount, groupCount, txCount };
}, ["landing-stats"], { revalidate: 60 });

function DiasporaRoute({ from, to }: { from: string; to: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[var(--muted)]">
      <span className="font-bold text-[var(--text)]">{from}</span>
      <span className="text-emerald-400/60">→</span>
      <span>{to}</span>
    </div>
  );
}

export default async function LandingPage() {
  const session = await getSession();
  const { t, lang } = await getServerT();
  const { userCount, groupCount, txCount } = await getStats();

  const FEATURES = [
    { icon: TrendingUp, title: t("landing", "feat1Title"), desc: t("landing", "feat1Desc"), accent: true },
    { icon: Shield,     title: t("landing", "feat2Title"), desc: t("landing", "feat2Desc"), accent: false },
    { icon: Globe,      title: t("landing", "feat3Title"), desc: t("landing", "feat3Desc"), accent: false },
    { icon: Zap,        title: t("landing", "feat4Title"), desc: t("landing", "feat4Desc"), accent: false },
    { icon: Users,      title: t("landing", "feat5Title"), desc: t("landing", "feat5Desc"), accent: false },
    { icon: Smartphone, title: t("landing", "feat6Title"), desc: t("landing", "feat6Desc"), accent: false },
  ];

  const HOW_STEPS = [
    { step: "01", title: t("landing", "step1Title"), desc: t("landing", "step1Desc"), detail: t("landing", "step1Detail") },
    { step: "02", title: t("landing", "step2Title"), desc: t("landing", "step2Desc"), detail: t("landing", "step2Detail") },
    { step: "03", title: t("landing", "step3Title"), desc: t("landing", "step3Desc"), detail: t("landing", "step3Detail") },
  ];

  const TESTIMONIALS = [
    { name: t("landing", "testi1Name"), city: t("landing", "testi1City"), quote: t("landing", "testi1Quote"), avatar: "AS" },
    { name: t("landing", "testi2Name"), city: t("landing", "testi2City"), quote: t("landing", "testi2Quote"), avatar: "EK" },
    { name: t("landing", "testi3Name"), city: t("landing", "testi3City"), quote: t("landing", "testi3Quote"), avatar: "FD" },
  ];

  const FAQ = [
    { q: t("landing", "faq1Q"), a: t("landing", "faq1A") },
    { q: t("landing", "faq2Q"), a: t("landing", "faq2A") },
    { q: t("landing", "faq3Q"), a: t("landing", "faq3A") },
    { q: t("landing", "faq4Q"), a: t("landing", "faq4A") },
    { q: t("landing", "faq5Q"), a: t("landing", "faq5A") },
    { q: t("landing", "faq6Q"), a: t("landing", "faq6A") },
  ];

  const displayUsers = Math.max(userCount, 120);
  const displayGroups = Math.max(groupCount, 18);
  const displayTx = Math.max(txCount, 340);

  return (
    <MotionPage>
      <div className="relative min-h-dvh overflow-hidden bg-[#080b07]">

        {/* Fond carte du monde */}
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "url('/world-map.png')", backgroundSize: "115%", backgroundPosition: "center -2%", backgroundRepeat: "no-repeat", opacity: 0.13, filter: "brightness(1.6) saturate(1.4) hue-rotate(-10deg)" }} />

        {/* Glow fond */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />

        <main className="relative mx-auto max-w-6xl px-5 py-5">

          {/* ── NAV ── */}
          <nav className="sticky top-0 z-50 -mx-5 flex items-center justify-between px-5 py-4 backdrop-blur-sm">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-base font-black text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.35)]">K</span>
              <span className="text-sm font-black tracking-tight text-white">Kotizy</span>
            </Link>
            <div className="flex items-center gap-2">
              <LangToggle />
              {!session && (
                <Link href="/register" className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-[#080b07] shadow-[0_0_16px_rgba(34,197,94,0.3)] transition hover:bg-emerald-400">
                  {t("landing", "cta")} <ArrowRight size={14} />
                </Link>
              )}
              <Link href={session ? (session.role === "ADMIN" ? "/admin" : "/dashboard") : "/login"} className="rounded-2xl bg-white/8 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-white/12">
                {session ? t("landing", "mySpace") : t("landing", "connect")}
              </Link>
            </div>
          </nav>

          {/* ── HERO ── */}
          <section className="grid min-h-[calc(100dvh-6rem)] items-center gap-12 py-12 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-4 py-2 text-xs font-bold text-emerald-400">
                <Sparkles size={13} />
                {t("landing", "tagline")}
              </div>

              <h1 className="max-w-2xl text-5xl font-black leading-[0.92] tracking-[-0.03em] text-white md:text-[68px]">
                {t("landing", "h1a")}<br />
                {t("landing", "h1b")}<br />
                <span className="text-emerald-400">{t("landing", "h1c")}</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-white/55 md:text-lg">
                {t("landing", "subtitle")}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <DiasporaRoute from="Paris" to="Abidjan" />
                <DiasporaRoute from="London" to="Lagos" />
                <DiasporaRoute from="Lyon" to="Dakar" />
                <DiasporaRoute from="Bruxelles" to="Kinshasa" />
                <DiasporaRoute from="Genève" to="Lomé" />
                <DiasporaRoute from="Madrid" to="Bamako" />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={session ? "/dashboard" : "/register"} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-black text-[#080b07] shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400 hover:shadow-[0_0_40px_rgba(34,197,94,0.55)]">
                  {session ? t("landing", "dashboard") : t("landing", "cta")}
                  <ArrowRight size={16} />
                </Link>
                <a href="https://github.com/kenams/tontine/releases/download/v2.1.0/kotizy-v2.1.0.apk" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white/6 px-6 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10">
                  <Download size={15} /> APK Android
                </a>
                <Link href="/install-ios" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white/6 px-6 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10">
                  <Smartphone size={15} /> iPhone / iOS
                </Link>
              </div>

              {/* Social proof inline */}
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["AS", "EK", "FD", "MK"].map((i) => (
                      <div key={i} className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/20 text-[9px] font-black text-emerald-400 ring-1 ring-emerald-500/30">{i}</div>
                    ))}
                  </div>
                  <span className="text-xs text-white/40">
                    <AnimatedCounter target={displayUsers} />{lang === "fr" ? " membres actifs" : " active members"}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />)}
                  <span className="ml-1 text-xs text-white/40">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Card preview */}
            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-[2rem] bg-white/5 p-5 ring-1 ring-white/8 backdrop-blur-sm">
                <div className="mb-4 rounded-[1.5rem] bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 p-5 ring-1 ring-emerald-500/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">Kotizy Wallet</p>
                      <p className="mt-1 text-3xl font-black text-white">240,00 €</p>
                      <p className="mt-0.5 text-xs text-white/40">≈ 157 440 XOF</p>
                    </div>
                    <BadgeCheck className="text-emerald-400" size={24} />
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <p className="font-bold tracking-[0.15em] text-white/40">•••• 2026</p>
                    <p className="text-xs text-white/40">EUR · XOF · GBP</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: t("landing", "previewLabel"), sub: t("landing", "previewSub"), val: "+50€", color: "text-emerald-400" },
                    { label: t("landing", "previewBadge"), sub: t("landing", "previewBadgeSub"), val: "★", color: "text-yellow-400" },
                    { label: t("landing", "previewPot"), sub: `K*** D. ${t("landing", "previewPotSub")}`, val: "400€", color: "text-white" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5">
                      <div>
                        <p className="text-xs font-bold text-white">{item.label}</p>
                        <p className="text-[10px] text-white/40">{item.sub}</p>
                      </div>
                      <span className={`text-xs font-black ${item.color}`}>{item.val}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl bg-emerald-500/8 p-3 ring-1 ring-emerald-500/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">{t("landing", "previewGroup")}</p>
                      <p className="text-[10px] text-white/40">{t("landing", "previewGroupSub")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">400€</p>
                      <p className="text-[10px] text-white/40">{t("landing", "previewPotLabel")}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[75%] rounded-full bg-emerald-500" />
                  </div>
                  <p className="mt-1 text-[10px] text-white/30">6/8 {t("landing", "previewProgress")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── STATS ANIMÉES ── */}
          <section className="border-t border-white/6 py-16">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { target: displayUsers, suffix: "+", label: lang === "fr" ? "Membres actifs" : "Active members", color: "text-emerald-400" },
                { target: displayGroups, suffix: "+", label: lang === "fr" ? "Cercles actifs" : "Active circles", color: "text-gold" },
                { target: displayTx, suffix: "+", label: lang === "fr" ? "Paiements traités" : "Payments processed", color: "text-emerald-400" },
                { target: 0, suffix: "€", label: lang === "fr" ? "Frais cachés" : "Hidden fees", color: "text-white" },
              ].map(({ target, suffix, label, color }) => (
                <div key={label} className="rounded-3xl bg-white/3 p-5 text-center ring-1 ring-white/6">
                  <p className={`text-3xl font-black ${color}`}>
                    {target === 0 ? "0" : <AnimatedCounter target={target} suffix={suffix} />}
                    {target === 0 && suffix}
                  </p>
                  <p className="mt-1 text-xs text-white/40">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── DOWNLOAD APP ── */}
          <section className="border-t border-white/6 py-20">
            <div className="rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 p-8 ring-1 ring-emerald-500/20 md:p-12">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-400/70">
                    {lang === "fr" ? "Application Mobile" : "Mobile App"}
                  </p>
                  <h2 className="text-3xl font-black text-white md:text-4xl">
                    {lang === "fr" ? "Kotizy dans votre poche." : "Kotizy in your pocket."}
                  </h2>
                  <p className="mt-3 text-white/50">
                    {lang === "fr"
                      ? "Notifications push, paiements Mobile Money, suivi en temps réel. L'expérience native sur Android."
                      : "Push notifications, Mobile Money payments, real-time tracking. Native Android experience."}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="https://github.com/kenams/tontine/releases/download/v2.1.0/kotizy-v2.1.0.apk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.35)] transition hover:bg-emerald-400"
                    >
                      <Download size={16} />
                      {lang === "fr" ? "Télécharger l'APK" : "Download APK"}
                    </a>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-5 py-3 text-sm font-bold text-white/40 ring-1 ring-white/10 cursor-not-allowed">
                      <Smartphone size={16} />
                      Google Play {lang === "fr" ? "(bientôt)" : "(soon)"}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex flex-col gap-3 text-sm">
                  {[
                    lang === "fr" ? "✅ Gratuit, sans pub" : "✅ Free, no ads",
                    lang === "fr" ? "✅ Fonctionne hors ligne" : "✅ Works offline",
                    lang === "fr" ? "✅ Notifications push" : "✅ Push notifications",
                    lang === "fr" ? "✅ Orange Money & Wave" : "✅ Orange Money & Wave",
                    lang === "fr" ? "✅ Paiement Stripe natif" : "✅ Native Stripe payment",
                  ].map((f) => (
                    <div key={f} className="rounded-xl bg-white/5 px-4 py-2 text-white/70">{f}</div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">{t("landing", "featuresLabel")}</div>
            <h2 className="mb-14 text-center text-3xl font-black tracking-tight text-white md:text-4xl">
              {t("landing", "featuresTitle")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
                <div key={title} className={`rounded-3xl p-6 ring-1 transition hover:bg-white/5 ${accent ? "bg-emerald-500/6 ring-emerald-500/20" : "bg-white/3 ring-white/6"}`}>
                  <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${accent ? "bg-emerald-500 text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "bg-white/8 text-emerald-400"}`}>
                    <Icon size={20} />
                  </div>
                  <p className="mb-2 font-black text-white">{title}</p>
                  <p className="text-sm leading-6 text-white/45">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── COMMENT ÇA MARCHE ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">{t("landing", "howLabel")}</div>
            <h2 className="mb-14 text-center text-3xl font-black text-white md:text-4xl">{t("landing", "howTitle")}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {HOW_STEPS.map(({ step, title, desc, detail }) => (
                <div key={step} className="relative rounded-3xl bg-white/3 p-6 ring-1 ring-white/8">
                  <div className="mb-4 text-5xl font-black text-emerald-500/20">{step}</div>
                  <p className="mb-2 text-lg font-black text-white">{title}</p>
                  <p className="text-sm leading-6 text-white/50">{desc}</p>
                  <div className="mt-4 rounded-2xl bg-emerald-500/8 px-3 py-2 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/15">{detail}</div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-white/30">
              {t("landing", "howFooter")} <span className="text-white/50">{t("landing", "howFooter2")}</span>
            </p>
          </section>

          {/* ── CALCULATRICE ÉPARGNE ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mx-auto max-w-2xl rounded-[2rem] bg-white/3 p-8 ring-1 ring-white/8 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-400/70">
                {lang === "fr" ? "Simulateur" : "Simulator"}
              </p>
              <h2 className="mb-2 text-2xl font-black text-white">
                {lang === "fr" ? "Combien récupères-tu ?" : "How much do you get?"}
              </h2>
              <p className="mb-8 text-white/40 text-sm">
                {lang === "fr" ? "Exemple : groupe de 8 personnes à 100€/mois" : "Example: group of 8 people at €100/month"}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { members: 5, amount: 50, label: lang === "fr" ? "Cercle Starter" : "Starter Circle" },
                  { members: 8, amount: 100, label: lang === "fr" ? "Cercle Famille" : "Family Circle", highlight: true },
                  { members: 12, amount: 200, label: lang === "fr" ? "Cercle Premium" : "Premium Circle" },
                ].map(({ members, amount, label, highlight }) => (
                  <div key={label} className={`rounded-2xl p-4 ${highlight ? "bg-emerald-500/15 ring-1 ring-emerald-500/30" : "bg-white/5"}`}>
                    <p className={`text-xs font-bold mb-2 ${highlight ? "text-emerald-400" : "text-white/40"}`}>{label}</p>
                    <p className="text-2xl font-black text-white">{members * amount}€</p>
                    <p className="text-[10px] text-white/40 mt-1">{members} × {amount}€</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-white/30">
                {lang === "fr" ? "Tu verses 100€/mois → tu reçois 800€ d'un coup. Zéro intérêt. Zéro frais." : "You pay €100/month → you receive €800 at once. Zero interest. Zero fees."}
              </p>
              <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.35)] transition hover:bg-emerald-400">
                {lang === "fr" ? "Créer mon cercle" : "Create my circle"} <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          {/* ── NIVEAUX GEMS ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">{t("landing", "gemLabel")}</div>
            <h2 className="mb-4 text-center text-3xl font-black text-white md:text-4xl">{t("landing", "gemTitle")}</h2>
            <p className="mb-12 text-center text-white/40">{t("landing", "gemSubtitle")}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GEM_TIERS.map((tier) => (
                <div key={tier.name} className="rounded-2xl p-5 transition hover:scale-[1.02]" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-2xl">{tier.emoji}</span>
                    <div>
                      <p className="font-black" style={{ color: tier.color }}>{tier.name}</p>
                      <p className="text-[10px] text-white/35">{tier.origin}</p>
                    </div>
                  </div>
                  <p className="mb-1 text-xs text-white/50">{tier.tagline}</p>
                  <p className="text-sm font-bold text-white">
                    {tier.maxCents === Infinity
                      ? `${(tier.minCents / 100).toLocaleString(lang === "en" ? "en-GB" : "fr-FR")}€+`
                      : `${(tier.minCents / 100).toLocaleString(lang === "en" ? "en-GB" : "fr-FR")} – ${(tier.maxCents / 100).toLocaleString(lang === "en" ? "en-GB" : "fr-FR")}€`}
                    <span className="ml-1 text-[10px] font-normal text-white/35">{t("landing", "perMonth")}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── TÉMOIGNAGES ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">{t("landing", "testiLabel")}</div>
            <h2 className="mb-12 text-center text-3xl font-black text-white md:text-4xl">{t("landing", "testiTitle")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map(({ name, city, quote, avatar }) => (
                <div key={name} className="rounded-3xl bg-white/3 p-6 ring-1 ring-white/6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/20 text-xs font-black text-emerald-400 ring-1 ring-emerald-500/20">{avatar}</div>
                    <div>
                      <p className="text-sm font-black text-white">{name}</p>
                      <p className="text-xs text-white/35">{city}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-white/55">"{quote}"</p>
                  <div className="mt-3 flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">{t("landing", "faqLabel")}</div>
            <h2 className="mb-12 text-center text-3xl font-black text-white md:text-4xl">{t("landing", "faqTitle")}</h2>
            <div className="mx-auto max-w-2xl space-y-3">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group rounded-3xl bg-white/3 ring-1 ring-white/6 open:ring-emerald-500/20">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-sm font-bold text-white list-none">
                    {q}
                    <ChevronDown size={16} className="shrink-0 text-white/30 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-6 pb-5 text-sm leading-6 text-white/50">{a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-white/30">
              {t("landing", "faqContact")}{" "}
              <a href="mailto:hello@kotizy.app" className="text-emerald-400 hover:underline">{t("landing", "faqContactLink")}</a>
            </p>
          </section>

          {/* ── CTA FINAL ── */}
          <section className="py-20 text-center">
            <div className="relative mx-auto max-w-2xl rounded-[2rem] bg-gradient-to-b from-emerald-500/10 to-transparent p-12 ring-1 ring-emerald-500/20">
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,197,94,0.15),transparent_70%)]" />
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-400/60">{t("landing", "ctaLabel")}</p>
              <h2 className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl">{t("landing", "ctaTitle")}</h2>
              <p className="mb-8 text-white/40">{t("landing", "ctaSubtitle")}</p>
              <Link href="/register" className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-emerald-500 px-10 text-base font-black text-[#080b07] shadow-[0_0_32px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400 hover:shadow-[0_0_56px_rgba(34,197,94,0.6)]">
                {t("landing", "ctaButton")} <ArrowRight size={20} />
              </Link>
              <p className="mt-4 text-xs text-white/25">
                {lang === "fr" ? "Gratuit · Sans carte bancaire · Prêt en 2 minutes" : "Free · No credit card · Ready in 2 minutes"}
              </p>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="border-t border-white/6 py-8 text-xs text-white/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span>© {new Date().getFullYear()} Kotizy</span>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/legal/mentions-legales" className="transition hover:text-white">{t("landing", "footerLegal")}</Link>
                <Link href="/legal/cgu" className="transition hover:text-white">{t("landing", "footerCgu")}</Link>
                <Link href="/legal/confidentialite" className="transition hover:text-white">{t("landing", "footerPrivacy")}</Link>
                <Link href="/legal/cookies" className="transition hover:text-white">{t("landing", "footerCookies")}</Link>
                <a href="https://kah-digital.ch/" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">{t("landing", "footerBy")}</a>
              </div>
            </div>
          </footer>

        </main>
      </div>
    </MotionPage>
  );
}
