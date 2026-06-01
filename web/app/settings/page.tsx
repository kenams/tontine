import { LockKeyhole, Star, Users, Gift } from "lucide-react";
import Link from "next/link";
import { DeleteAccountButton } from "@/components/app/delete-account-button";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { PushSubscribeButton } from "@/components/app/push-subscribe";
import { SettingsToggles } from "@/components/app/settings-toggles";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const session = await requireUser();
  const userPlan = await prisma.user.findUnique({ where: { id: session.userId }, select: { plan: true } as never }) as { plan: string } | null;
  const isPremium = userPlan?.plan === "PREMIUM";

  return (
    <MobileShell user={session} title="Paramètres">
      <PageHeading eyebrow="Compte" title="Paramètres">
        Préférences, notifications et sécurité.
      </PageHeading>

      {/* Bloc Premium */}
      {isPremium ? (
        <div className="glass mb-3 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/20">
              <Star size={18} className="text-amber-400" fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="font-black text-amber-400">Kotizy Premium ⭐</p>
              <p className="text-sm text-smoke">Tontines illimitées · Badge vérifié · Stats avancées</p>
            </div>
            <form action="/api/subscription" method="POST">
              <input type="hidden" name="action" value="portal" />
              <button className="rounded-xl border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20">
                Gérer
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="glass mb-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/20">
              <Star size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-black">Passe Premium</p>
              <p className="text-sm text-smoke">4.99€/mois · Sans engagement</p>
            </div>
          </div>
          <div className="mb-3 space-y-1.5 text-sm text-[var(--muted)]">
            {["Tontines illimitées (vs 1 en gratuit)", "Jusqu'à 30 membres par groupe", "Badge ✓ vérifié sur ton profil", "Statistiques avancées"].map(f => (
              <div key={f} className="flex items-center gap-2"><span className="text-emerald-400">✓</span>{f}</div>
            ))}
          </div>
          <Link href="/api/subscription" className="block w-full rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-black text-ink transition hover:bg-emerald-400">
            Activer Premium →
          </Link>
        </div>
      )}

      {/* Parrainage */}
      <Link href="/referral" className="glass mb-3 flex items-center gap-3 rounded-3xl p-4 transition hover:border-emerald-500/40">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
          <Gift size={18} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="font-black">Parrainage</p>
          <p className="text-sm text-smoke">Invite tes amis · Gagne 5€ par filleul</p>
        </div>
        <span className="text-smoke">→</span>
      </Link>

      {/* Marketplace */}
      <Link href="/marketplace" className="glass mb-3 flex items-center gap-3 rounded-3xl p-4 transition hover:border-emerald-500/40">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
          <Users size={18} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="font-black">Marketplace</p>
          <p className="text-sm text-smoke">Rejoins une tontine publique</p>
        </div>
        <span className="text-smoke">→</span>
      </Link>

      <div className="glass mb-3 flex items-center justify-between rounded-3xl p-4">
        <div>
          <p className="font-black">Mode sombre</p>
          <p className="text-sm text-smoke">Basculer entre dark et light.</p>
        </div>
        <ThemeToggle />
      </div>

      <PushSubscribeButton />

      <SettingsToggles />

      <div className="glass mt-3 rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <LockKeyhole size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-black">Sécurité</p>
            <p className="text-sm text-smoke">Cookie httpOnly · Bcrypt · RBAC · RLS Supabase</p>
          </div>
        </div>
      </div>

      <div className="glass mt-3 rounded-3xl p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-smoke">Légal & RGPD</p>
        <div className="space-y-2">
          {[
            { href: "/legal/cgu", label: "Conditions Générales d'Utilisation" },
            { href: "/legal/confidentialite", label: "Politique de confidentialité" },
            { href: "/api/user/delete", label: "Exporter mes données (RGPD)", download: true },
          ].map((item) => (
            <Link key={item.href} href={item.href} target={item.download ? undefined : "_blank"}
              className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10">
              <span>{item.label}</span>
              <span className="text-smoke">→</span>
            </Link>
          ))}
          <DeleteAccountButton />
        </div>
      </div>
    </MobileShell>
  );
}
