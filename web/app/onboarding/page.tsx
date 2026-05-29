import { ArrowRight, Shield, Star, TrendingUp, Users, WalletCards } from "lucide-react";
import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { requireUser } from "@/lib/auth";

const steps = [
  {
    icon: WalletCards,
    color: "bg-emerald-500/15 text-emerald-400",
    title: "Wallet à zéro — réel",
    body: "Votre solde démarre à 0. Alimentez-le via Revolut, virement bancaire ou Stripe pour payer vos cotisations en 1 clic."
  },
  {
    icon: Users,
    color: "bg-gold/15 text-gold",
    title: "Créez ou rejoignez un groupe",
    body: "Invitez vos proches avec un lien ou un code. Chaque groupe a sa page publique partageable."
  },
  {
    icon: TrendingUp,
    color: "bg-emerald-500/15 text-emerald-400",
    title: "Cotisez, montez en score",
    body: "Chaque paiement à l'heure renforce votre score de confiance. Débutant → Bronze → Avancé → Gold → Élite."
  },
  {
    icon: Star,
    color: "bg-gold/15 text-gold",
    title: "Débloquez des badges",
    body: "Ponctuel, Régulier, Fondateur, Vétéran... 7 badges à collecter selon votre comportement de paiement."
  },
  {
    icon: Shield,
    color: "bg-[var(--surface-strong)] text-[var(--muted)]",
    title: "100% sécurisé",
    body: "Bcrypt, sessions HMAC-SHA256, RLS sur toutes les tables Supabase. Votre argent et vos données sont protégés."
  }
];

export default async function OnboardingPage() {
  const session = await requireUser();
  return (
    <MobileShell user={session} title="Bienvenue">
      <div className="pb-4">
        <div className="mb-6">
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-[1.25rem] bg-emerald-500 text-ink shadow-glow">
            <span className="text-2xl font-black">K</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Kotizy · Bienvenue</p>
          <h1 className="mt-1 text-3xl font-black">Votre compte est prêt.</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Découvrez comment Kotizy fonctionne en 5 points.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map(({ icon: Icon, color, title, body }, i) => (
            <div key={title} className="glass flex gap-4 rounded-3xl p-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${color}`}>
                <Icon size={19} />
              </div>
              <div className="min-w-0">
                <p className="font-black">{title}</p>
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="mt-6 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-base font-black text-ink shadow-glow transition hover:bg-emerald-400"
        >
          Ouvrir mon dashboard <ArrowRight size={20} />
        </Link>
      </div>
    </MobileShell>
  );
}
