import { Award, Copy, Fingerprint, KeyRound, ShieldCheck, TrendingUp, UserRound } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";
import { trustLevel } from "@/lib/trust";
import { initials, money } from "@/lib/format";

const badgeColors: Record<string, string> = {
  gold:    "bg-gold/15 text-gold ring-gold/25",
  emerald: "bg-emerald-500/15 text-emerald-400 ring-emerald-400/25",
  ivory:   "bg-white/10 text-[var(--text)] ring-white/10"
};

export default async function ProfilePage() {
  const session = await requireUser();
  const { user, memberships, transactions } = await getUserDashboard(session.userId);
  const walletCurrency = user.wallet?.currency ?? "XOF";
  const trust = user.trustScore?.score ?? 50;
  const level = trustLevel(trust);
  const paidCount = transactions.filter((t) => t.status === "PAID").length;
  const lateCount = memberships.filter((m) => m.status === "LATE").length;
  const totalPaid = transactions.filter((t) => t.status === "PAID").reduce((s, t) => s + t.amountCents, 0);

  const nextPoints = level.next !== null ? level.next - trust : 0;

  return (
    <MobileShell user={session} title="Profil">
      <PageHeading eyebrow="Identité" title="Profil">
        Réputation, badges et sécurité de compte.
      </PageHeading>

      {/* Avatar + identité */}
      <div className="glass mb-4 rounded-[1.75rem] p-5 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[1.5rem] bg-emerald-500 text-2xl font-black text-ink shadow-glow">
          {initials(user.fullName)}
        </div>
        <h1 className="text-2xl font-black">{user.fullName}</h1>
        <p className="text-sm text-[var(--muted)]">{user.email}</p>
        <div className="mt-3 flex justify-center gap-2">
          <StatusBadge value={user.status} />
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ring-1 ${trust >= 85 ? badgeColors.gold : badgeColors.emerald}`}>
            {level.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label={`Wallet ${walletCurrency}`} value={money(user.wallet?.balanceCents ?? 0, walletCurrency)} icon={<UserRound size={18} />} />
        <StatCard label="Groupes actifs" value={String(memberships.filter(m => m.status !== "LATE").length)} icon={<Award size={18} />} />
        <StatCard label="Cotisations payées" value={String(paidCount)} icon={<TrendingUp size={18} />} accent />
        <StatCard label="Épargne totale" value={money(totalPaid, walletCurrency)} icon={<TrendingUp size={18} />} />
      </div>

      {/* Score de confiance */}
      <div className="glass mb-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <p className="text-sm font-black">Score de confiance</p>
          </div>
          <div className="text-right">
            <p className={`font-black ${level.color}`}>{trust}/100</p>
            <p className="text-[10px] text-[var(--muted)]">{level.label}</p>
          </div>
        </div>
        <ProgressBar value={trust} />
        {level.next !== null && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {nextPoints} points pour atteindre le niveau <span className="font-bold text-[var(--text)]">{trustLevel(level.next).label}</span>. Payez à temps pour progresser.
          </p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[var(--muted)]">
          <div className="rounded-2xl bg-[var(--surface)] p-3">
            <p className="font-black text-[var(--text)]">{user.trustScore?.paymentReliability ?? 50}</p>
            Paiement
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-3">
            <p className="font-black text-[var(--text)]">{user.trustScore?.communityRating ?? 50}</p>
            Communauté
          </div>
          <div className={`rounded-2xl bg-[var(--surface)] p-3 ${lateCount > 0 ? "ring-1 ring-rose-400/30" : ""}`}>
            <p className={`font-black ${lateCount > 0 ? "text-rose-400" : "text-[var(--text)]"}`}>{lateCount}</p>
            Retards
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="glass mb-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black">
          <Fingerprint size={18} className="text-gold" />
          Badges obtenus ({user.badges.length})
        </div>
        {user.badges.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Effectuez vos premières cotisations pour débloquer vos badges.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.badges.map(({ badge }) => (
              <span
                key={badge.id}
                title={badge.description}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${badgeColors[badge.color] ?? badgeColors.ivory}`}
              >
                {badge.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions compte */}
      <div className="glass mb-4 rounded-3xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-black mb-2">
          <KeyRound size={16} className="text-gold" />
          Sécurité du compte
        </div>
        <Link href="/forgot-password" className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--surface)] text-sm font-bold text-[var(--text)] transition hover:bg-[var(--surface-strong)]">
          Changer mon mot de passe
        </Link>
      </div>

      <div className="glass rounded-3xl p-2">
        <LogoutButton />
      </div>
    </MobileShell>
  );
}
