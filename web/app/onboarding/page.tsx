import { ArrowRight, BellRing, ShieldCheck, WalletCards } from "lucide-react";
import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { requireUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const session = await requireUser();
  return (
    <MobileShell user={session} title="Onboarding">
      <div className="space-y-4">
        <div className="glass rounded-[1.75rem] p-5">
          <p className="text-xs font-bold uppercase text-gold">Demarrage</p>
          <h1 className="mt-2 text-3xl font-black">Votre finance sociale en 3 gestes.</h1>
          <p className="mt-3 text-sm leading-6 text-smoke">
            Wallet test pret, score de confiance initialise et notifications internes activees.
          </p>
        </div>
        {[
          ["Wallet test", "Solde fictif pour tester les cotisations sans risque.", WalletCards],
          ["Confiance", "Score comportemental base sur ponctualite et communaute.", ShieldCheck],
          ["Rappels", "Alertes avant echeance, paiements en attente et messages groupe.", BellRing]
        ].map(([title, body, Icon]) => (
          <div key={String(title)} className="glass rounded-3xl p-4">
            <Icon className="mb-3 text-emerald-400" size={22} />
            <p className="font-black">{String(title)}</p>
            <p className="mt-1 text-sm leading-6 text-smoke">{String(body)}</p>
          </div>
        ))}
        <Link href="/dashboard" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-black text-ink shadow-glow">
          Ouvrir mon dashboard <ArrowRight size={18} />
        </Link>
      </div>
    </MobileShell>
  );
}
