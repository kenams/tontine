import { Award, Fingerprint, ShieldCheck, UserRound } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";
import { initials, money } from "@/lib/format";

export default async function ProfilePage() {
  const session = await requireUser();
  const { user, memberships } = await getUserDashboard(session.userId);
  const walletCurrency = user.wallet?.currency ?? "XOF";
  const trust = user.trustScore?.score ?? 70;

  return (
    <MobileShell user={session} title="Profil">
      <PageHeading eyebrow="Identite" title="Profil">
        KYC, badges, confiance et preferences.
      </PageHeading>
      <div className="glass mb-4 rounded-[1.75rem] p-5 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[1.5rem] bg-emerald-500 text-2xl font-black text-ink shadow-glow">
          {initials(user.fullName)}
        </div>
        <h1 className="text-2xl font-black">{user.fullName}</h1>
        <p className="text-sm text-smoke">{user.email}</p>
        <div className="mt-3 flex justify-center">
          <StatusBadge value={user.status} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label={`Wallet ${walletCurrency}`} value={money(user.wallet?.balanceCents ?? 0, walletCurrency)} icon={<UserRound size={18} />} />
        <StatCard label="Tontines" value={String(memberships.length)} icon={<Award size={18} />} />
      </div>

      <div className="glass mb-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <p className="text-sm font-black">Score de confiance</p>
          </div>
          <p className="font-black">{trust}/100</p>
        </div>
        <ProgressBar value={trust} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-smoke">
          <div className="rounded-2xl bg-white/[0.08] p-3">
            <p className="font-black text-ivory">{user.trustScore?.paymentReliability ?? 80}</p>
            Paiement
          </div>
          <div className="rounded-2xl bg-white/[0.08] p-3">
            <p className="font-black text-ivory">{user.trustScore?.communityRating ?? 80}</p>
            Communaute
          </div>
          <div className="rounded-2xl bg-white/[0.08] p-3">
            <p className="font-black text-ivory">{user.trustScore?.fraudRisk ?? 10}</p>
            Risque
          </div>
        </div>
      </div>

      <div className="glass mb-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black">
          <Fingerprint size={18} className="text-gold" />
          Badges
        </div>
        <div className="flex flex-wrap gap-2">
          {user.badges.map(({ badge }) => (
            <span key={badge.id} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-ivory ring-1 ring-white/10">
              {badge.name}
            </span>
          ))}
        </div>
      </div>
      <div className="glass rounded-3xl p-2">
        <LogoutButton />
      </div>
    </MobileShell>
  );
}
