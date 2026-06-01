import { ArrowRight, BadgeCheck, ChevronDown, Globe, MessageCircle, Shield, Smartphone, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { GEM_TIERS } from "@/lib/tiers";
import Link from "next/link";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { LangToggle } from "@/components/app/lang-toggle";
import { MotionPage } from "@/components/ui/motion";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/* ── Pill de ville avec ligne de connexion ── */
function DiasporaRoute({ from, to }: { from: string; to: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-[var(--muted)]">
      <span className="font-bold text-[var(--text)]">{from}</span>
      <span className="text-emerald-400/60">→</span>
      <span>{to}</span>
    </div>
  );
}

const TESTIMONIALS = [
  { name: "Aminata S.", city: "Paris → Dakar", quote: "J'organise les tontines de ma famille depuis des années sur WhatsApp. Avec Kotizy, tout est automatique. Même ma maman l'utilise !", avatar: "AS" },
  { name: "Emmanuel K.", city: "Lyon → Abidjan", quote: "J'ai reçu mon premier pot de 800€ en 8 mois. Simple, transparent, sans risque. Le score de confiance a tout changé.", avatar: "EK" },
  { name: "Fatou D.", city: "Londres → Bamako", quote: "Notre cercle familial de 10 personnes cotise 100€/mois depuis un an. Personne n'a jamais eu de retard. Fiabilité 100%.", avatar: "FD" },
];

const FAQ = [
  { q: "C'est quoi une tontine ?", a: "Une tontine est une épargne collective où chaque membre verse une somme fixe chaque mois. À tour de rôle, un membre reçoit la totalité de la mise collective. Tout le monde donne la même chose, tout le monde reçoit la même chose — mais en une seule fois." },
  { q: "Est-ce que mon argent est sécurisé ?", a: "Oui. Les paiements sont traités par Stripe (agréé EME, Banque Centrale d'Irlande). Vos données sont chiffrées, les sessions sont signées HMAC-SHA256 et la base de données est protégée par Supabase RLS." },
  { q: "Combien ça coûte ?", a: "Kotizy est gratuit pour créer un compte et rejoindre des groupes. Une commission de 1,25% s'applique uniquement lors du versement du pot." },
  { q: "Comment fonctionne le score de confiance ?", a: "Chaque paiement à l'heure vous fait progresser : Débutant → Bronze → Intermédiaire → Avancé → Gold → Élite. Ce score est public, visible sur votre profil, et renforce la confiance dans votre cercle." },
  { q: "Peut-on cotiser depuis l'Afrique ?", a: "Pour l'instant, le wallet accepte les paiements depuis l'Europe (carte bancaire, virement SEPA). Le Mobile Money (Wave, Orange Money, MTN) est en cours d'intégration." },
  { q: "Que se passe-t-il si un membre ne paie pas ?", a: "Un rappel automatique est envoyé 3 jours avant l'échéance. En cas de retard, le score de confiance du membre est impacté et une pénalité peut s'appliquer selon les règles du groupe." },
];

export default async function LandingPage() {
  const session = await getSession();
  const [userCount, groupCount] = await Promise.all([
    prisma.user.count(),
    prisma.tontineGroup.count({ where: { status: "ACTIVE" } }),
  ]).catch(() => [0, 0]);

  return (
    <MotionPage>
      <div className="relative min-h-dvh overflow-hidden bg-[#080b07]">

        {/* ── FOND MONDE ── */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "url('/world-map.png')",
            backgroundSize: "115%",
            backgroundPosition: "center -2%",
            backgroundRepeat: "no-repeat",
            opacity: 0.13,
            filter: "brightness(1.6) saturate(1.4) hue-rotate(-10deg)",
          }}
        />

        <main className="relative mx-auto max-w-6xl px-5 py-5">

          {/* ── NAV ── */}
          <nav className="sticky top-0 z-50 -mx-5 flex items-center justify-between px-5 py-3 backdrop-blur-xl bg-[#080b07]/70 border-b border-white/5">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-base font-black text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.35)]">K</span>
              <span className="text-sm font-black tracking-tight text-white">Kotizy</span>
            </Link>
            <div className="flex items-center gap-2">
              <LangToggle />
              <ThemeToggle />
              {!session && (
                <Link href="/register" className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-[#080b07] shadow-[0_0_16px_rgba(34,197,94,0.3)] transition hover:bg-emerald-400">
                  S'inscrire
                </Link>
              )}
              <Link
                href={session ? (session.role === "ADMIN" ? "/admin" : "/dashboard") : "/login"}
                className="rounded-2xl bg-white/8 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-white/12"
              >
                {session ? "Mon espace" : "Connexion"}
              </Link>
            </div>
          </nav>

          {/* ── HERO ── */}
          <section className="grid min-h-[calc(100dvh-6rem)] items-center gap-12 py-12 lg:grid-cols-[1fr_420px]">
            <div>
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-4 py-2 text-xs font-bold text-emerald-400">
                <Sparkles size={13} />
                La tontine de la diaspora
              </div>

              {/* Titre */}
              <h1 className="max-w-2xl text-5xl font-black leading-[0.92] tracking-[-0.03em] text-white md:text-[68px]">
                Épargnez<br />
                ensemble.<br />
                <span className="text-emerald-400">En euros.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-white/55 md:text-lg">
                La tontine digitale pour la diaspora africaine. Cotisez en euros depuis Paris, London ou Lyon. Votre famille reçoit en XOF, NGN, GHS.
              </p>

              {/* Routes diaspora */}
              <div className="mt-5 flex flex-wrap gap-2">
                <DiasporaRoute from="Paris" to="Abidjan" />
                <DiasporaRoute from="London" to="Lagos" />
                <DiasporaRoute from="Lyon" to="Dakar" />
                <DiasporaRoute from="Bruxelles" to="Kinshasa" />
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={session ? "/dashboard" : "/register"}
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-black text-[#080b07] shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400"
                >
                  {session ? "Mon dashboard" : "Commencer gratuitement"}
                  <ArrowRight size={16} />
                </Link>
                <Link href="/login" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white/6 px-6 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10">
                  Se connecter
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap gap-8">
                {[
                  ["50€", "cotisation min."],
                  ["100%", "chiffré"],
                  ["0€", "frais cachés"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <p className="text-2xl font-black text-white">{v}</p>
                    <p className="text-xs text-white/40">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CARD PREVIEW ── */}
            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-[2rem] bg-white/5 p-5 ring-1 ring-white/8 backdrop-blur-sm">

                {/* Wallet card */}
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

                {/* Activité live */}
                <div className="space-y-2">
                  {[
                    { label: "Cotisation validée", sub: "Cercle Émeraude · Paris", val: "+50€", color: "text-emerald-400" },
                    { label: "Badge Ponctuel", sub: "Récompense obtenue", val: "★", color: "text-yellow-400" },
                    { label: "Pot du mois", sub: "K*** D. a reçu", val: "400€", color: "text-white" },
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

                {/* Exemple de groupe */}
                <div className="mt-3 rounded-2xl bg-emerald-500/8 p-3 ring-1 ring-emerald-500/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">Cercle Émeraude</p>
                      <p className="text-[10px] text-white/40">8 membres · 50€/mois</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">400€</p>
                      <p className="text-[10px] text-white/40">pot mensuel</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[75%] rounded-full bg-emerald-500" />
                  </div>
                  <p className="mt-1 text-[10px] text-white/30">6/8 membres ont cotisé ce mois</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">Pourquoi Kotizy</div>
            <h2 className="mb-14 text-center text-3xl font-black tracking-tight text-white md:text-4xl">
              Tout ce dont votre<br />cercle a besoin.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: TrendingUp, title: "Cotisations automatiques", desc: "Planifiez, cotisez et suivez les paiements de votre groupe en temps réel. Score de confiance calculé automatiquement.", accent: true },
                { icon: Shield, title: "Score de confiance", desc: "Chaque paiement à l'heure renforce votre réputation. Débutant → Bronze → Avancé → Gold → Élite.", accent: false },
                { icon: Globe, title: "Multi-devises diaspora", desc: "EUR, GBP, XOF, NGN, GHS, KES et plus. Cotisez depuis l'Europe, recevez en Afrique.", accent: false },
                { icon: Zap, title: "Paiements mobiles", desc: "Wallet intégré, Stripe, Wave, Orange Money, MTN MoMo. Payer en 1 clic depuis votre banque européenne.", accent: false },
                { icon: Users, title: "Invitez votre cercle", desc: "Partagez un lien. Les membres rejoignent en 30 secondes. Kotizy, c'est votre communauté digitale.", accent: false },
                { icon: Smartphone, title: "App native Android", desc: "Téléchargez l'APK ou installez la PWA. Notifications push, accès offline, expérience native.", accent: false },
              ].map(({ icon: Icon, title, desc, accent }) => (
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
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">Simple comme bonjour</div>
            <h2 className="mb-14 text-center text-3xl font-black text-white md:text-4xl">
              Comment ça marche ?
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Créez votre cercle",
                  desc: "Choisissez un montant (ex: 100€/mois), invitez 7 amis ou famille. Votre groupe est prêt en 2 minutes.",
                  detail: "8 membres × 100€ = 800€ dans le pot",
                },
                {
                  step: "02",
                  title: "Chacun cotise chaque mois",
                  desc: "À chaque échéance, chaque membre verse 100€ depuis son wallet. Automatique, rappel 3 jours avant.",
                  detail: "Paiement en 1 clic, depuis votre banque européenne",
                },
                {
                  step: "03",
                  title: "Un membre reçoit le pot",
                  desc: "À tour de rôle, un membre reçoit les 800€ d'un coup. En 8 mois, tout le monde aura reçu son pot.",
                  detail: "Vous donnez 800€ sur 8 mois. Vous recevez 800€ en 1 fois.",
                },
              ].map(({ step, title, desc, detail }) => (
                <div key={step} className="relative rounded-3xl bg-white/3 p-6 ring-1 ring-white/8">
                  <div className="mb-4 text-5xl font-black text-emerald-500/20">{step}</div>
                  <p className="mb-2 text-lg font-black text-white">{title}</p>
                  <p className="text-sm leading-6 text-white/50">{desc}</p>
                  <div className="mt-4 rounded-2xl bg-emerald-500/8 px-3 py-2 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/15">
                    {detail}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-white/30">
              La tontine = accès immédiat à un capital collectif, basé sur la confiance. <span className="text-white/50">Personne ne gagne, personne ne perd — mais tout le monde accède à plus.</span>
            </p>
          </section>

          {/* ── NIVEAUX GEMS ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">Tous les niveaux</div>
            <h2 className="mb-4 text-center text-3xl font-black text-white md:text-4xl">
              Choisissez votre cercle
            </h2>
            <p className="mb-12 text-center text-white/40">Des gems africaines pour valoriser votre engagement. Plus vous cotisez, plus vous brillez.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GEM_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className="rounded-2xl p-5 transition hover:scale-[1.02]"
                  style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
                >
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
                      ? `${(tier.minCents / 100).toLocaleString("fr-FR")}€+`
                      : `${(tier.minCents / 100).toLocaleString("fr-FR")} – ${(tier.maxCents / 100).toLocaleString("fr-FR")}€`}
                    <span className="ml-1 text-[10px] font-normal text-white/35">/ mois</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── SOCIAL PROOF ── */}
          <section className="border-t border-white/6 py-16">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { value: userCount > 0 ? `${userCount}+` : "100+", label: "Membres actifs" },
                { value: groupCount > 0 ? `${groupCount}+` : "20+", label: "Cercles créés" },
                { value: "0€", label: "Frais cachés" },
                { value: "100%", label: "Données chiffrées" },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-3xl bg-white/3 p-5 text-center ring-1 ring-white/6">
                  <p className="text-3xl font-black text-emerald-400">{value}</p>
                  <p className="mt-1 text-xs text-white/40">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── TÉMOIGNAGES ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">Ils kotisent déjà</div>
            <h2 className="mb-12 text-center text-3xl font-black text-white md:text-4xl">
              La diaspora nous fait confiance.
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map(({ name, city, quote, avatar }) => (
                <div key={name} className="rounded-3xl bg-white/3 p-6 ring-1 ring-white/6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/20 text-xs font-black text-emerald-400 ring-1 ring-emerald-500/20">
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{name}</p>
                      <p className="text-xs text-white/35">{city}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-white/55">"{quote}"</p>
                  <div className="mt-3 flex gap-0.5">
                    {[1,2,3,4,5].map(i => <span key={i} className="text-gold text-xs">★</span>)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="border-t border-white/6 py-20">
            <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-white/30">Questions fréquentes</div>
            <h2 className="mb-12 text-center text-3xl font-black text-white md:text-4xl">
              Tout ce que vous voulez savoir.
            </h2>
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
              Une autre question ?{" "}
              <a href="mailto:hello@kotizy.app" className="text-emerald-400 hover:underline">
                Écrivez-nous
              </a>
            </p>
          </section>

          {/* ── CTA FINAL ── */}
          <section className="py-20 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-400/60">Gratuit · Sans engagement</p>
            <h2 className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              Prêt à kotiser ?
            </h2>
            <p className="mb-8 text-white/40">Créez votre groupe en 2 minutes.</p>
            <Link href="/register" className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-emerald-500 px-10 text-base font-black text-[#080b07] shadow-[0_0_32px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400 hover:shadow-[0_0_48px_rgba(34,197,94,0.5)]">
              Créer mon compte <ArrowRight size={20} />
            </Link>
          </section>

          {/* ── FOOTER ── */}
          <footer className="border-t border-white/6 py-8 text-xs text-white/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span>© {new Date().getFullYear()} Kotizy</span>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/legal/mentions-legales" className="transition hover:text-white">Mentions légales</Link>
                <Link href="/legal/cgu" className="transition hover:text-white">CGU</Link>
                <Link href="/legal/confidentialite" className="transition hover:text-white">Confidentialité</Link>
                <Link href="/legal/cookies" className="transition hover:text-white">Cookies</Link>
                <a href="https://kah-digital.ch/" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
                  Un produit KAH Digital
                </a>
              </div>
            </div>
          </footer>

        </main>
      </div>
    </MotionPage>
  );
}
