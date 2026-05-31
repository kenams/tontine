import { ArrowRight, BadgeCheck, Globe, Shield, Smartphone, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { MotionPage } from "@/components/ui/motion";
import { getSession } from "@/lib/auth";

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

export default async function LandingPage() {
  const session = await getSession();

  return (
    <MotionPage>
      <div className="relative min-h-dvh overflow-hidden bg-[#080b07]">

        {/* ── FOND MONDE ── */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "url('/world-map.png')",
            backgroundSize: "110%",
            backgroundPosition: "center 40%",
            backgroundRepeat: "no-repeat",
            opacity: 0.06,
            filter: "brightness(1.4) saturate(0.8)",
          }}
        />

        <main className="relative mx-auto max-w-6xl px-5 py-5">

          {/* ── NAV ── */}
          <nav className="flex items-center justify-between py-2">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-base font-black text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.35)]">K</span>
              <span className="text-sm font-black tracking-tight text-white">Kotizy</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
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

          {/* ── SOCIAL PROOF ── */}
          <section className="py-16">
            <div className="rounded-3xl bg-emerald-500/6 p-8 ring-1 ring-emerald-500/15 md:p-12">
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  { val: "50€", label: "cotisation min.", sub: "par mois" },
                  { val: "8", label: "membres max.", sub: "par groupe" },
                  { val: "0€", label: "frais d'entrée", sub: "gratuit pour toujours" },
                ].map(({ val, label, sub }) => (
                  <div key={label} className="text-center">
                    <p className="text-4xl font-black text-emerald-400">{val}</p>
                    <p className="mt-1 font-bold text-white">{label}</p>
                    <p className="text-sm text-white/40">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
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
