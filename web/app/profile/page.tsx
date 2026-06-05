import { AlertTriangle, Award, ExternalLink, Fingerprint, KeyRound, ShieldCheck, TrendingUp, UserRound, Flame } from "lucide-react";
import Link from "next/link";
import { AvatarUpload } from "@/components/app/avatar-upload";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { ProfileEditForm } from "@/components/app/profile-edit-form";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";
import { trustLevel, streakLabel } from "@/lib/trust";
import { badgeMeta } from "@/lib/badges";
import { getServerT } from "@/lib/i18n/server";
import { initials, money } from "@/lib/format";

export const revalidate = 0;

const badgeColors: Record<string, string> = {
  gold:    "bg-gold/15 text-gold ring-gold/25",
  emerald: "bg-emerald-500/15 text-emerald-400 ring-emerald-400/25",
  ivory:   "bg-white/10 text-[var(--text)] ring-white/10",
};

async function getDebtMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId, debtCents: { gt: 0 } },
    select: { id: true, debtCents: true, tontineGroup: { select: { name: true, id: true, currency: true } } },
  });
}

export default async function ProfilePage() {
  const session = await requireUser();

  const [{ user, memberships, transactions }, debtMemberships] = await Promise.all([
    getUserDashboard(session.userId),
    getDebtMemberships(session.userId),
  ]);
  const { lang, t } = await getServerT();
  const totalDebt = debtMemberships.reduce((s, m) => s + (m.debtCents ?? 0), 0);

  const walletCurrency = user.wallet?.currency ?? "XOF";
  const trust = user.trustScore?.score ?? 0;
  const streak = user.trustScore?.paymentStreak ?? 0;
  const level = trustLevel(trust);
  const paidCount = transactions.filter((tx) => tx.status === "PAID").length;
  const lateCount = memberships.filter((m) => m.status === "LATE").length;
  const totalPaid = transactions.filter((tx) => tx.status === "PAID").reduce((s, tx) => s + tx.amountCents, 0);
  const nextPoints = level.next !== null ? level.next - trust : 0;

  const levelLabel = lang === "en" ? level.labelEn : level.label;
  const nextLevelLabel = level.next !== null ? (lang === "en" ? trustLevel(level.next).labelEn : trustLevel(level.next).label) : "";

  return (
    <MobileShell user={session} title={t("profile", "title")}>
      <PageHeading eyebrow={t("profile", "eyebrow")} title={t("profile", "title")}>
        {t("profile", "subtitle")}
      </PageHeading>

      {/* Avatar + identité */}
      <div className="glass mb-4 rounded-[1.75rem] p-5 text-center">
        <div className="mb-4 flex justify-center">
          <AvatarUpload currentUrl={user.avatarUrl} initials={initials(user.fullName)} />
        </div>
        <h1 className="text-2xl font-black">{user.fullName}</h1>
        <p className="text-sm text-[var(--muted)]">{user.email}</p>
        <div className="mt-3 flex justify-center gap-2">
          <StatusBadge value={user.status} />
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ring-1 ${trust >= 85 ? badgeColors.gold : badgeColors.emerald}`}>
            {levelLabel}
          </span>
          {streak >= 3 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-400 ring-1 ring-orange-400/25">
              <Flame size={10} /> {streak}
            </span>
          )}
        </div>
        <Link
          href={`/u/${encodeURIComponent(user.email.split("@")[0])}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/15 transition"
          target="_blank"
        >
          <ExternalLink size={11} /> {t("profile", "publicProfile")}
        </Link>
      </div>

      <ProfileEditForm initialName={user.fullName} initialPhone={user.phone} />

      {/* Alerte dettes globales */}
      {totalDebt > 0 && (
        <div className="mb-4 glass rounded-3xl p-4 ring-1 ring-gold/20">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-gold">
            <AlertTriangle size={16} /> {t("profile", "debts")}
          </div>
          <div className="space-y-2">
            {(debtMemberships as unknown as Array<{ debtCents: number; tontineGroup: { name: string; id: string; currency: string } }>).map((m) => (
              <Link key={m.tontineGroup.id} href={`/tontines/${m.tontineGroup.id}`}
                className="flex items-center justify-between rounded-2xl bg-[var(--surface)] px-3 py-2.5 text-sm hover:bg-[var(--surface-strong)] transition">
                <span className="font-bold">{m.tontineGroup.name}</span>
                <span className="font-black text-gold">{money(m.debtCents, m.tontineGroup.currency)}</span>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">{t("profile", "debtsSub")}</p>
        </div>
      )}

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label={`Wallet ${walletCurrency}`} value={money(user.wallet?.balanceCents ?? 0, walletCurrency)} icon={<UserRound size={18} />} />
        <StatCard label={t("profile", "groups")} value={String(memberships.filter((m) => m.status !== "LATE").length)} icon={<Award size={18} />} />
        <StatCard label={t("profile", "paid")} value={String(paidCount)} icon={<TrendingUp size={18} />} accent />
        <StatCard label={t("profile", "totalPaid")} value={money(totalPaid, walletCurrency)} icon={<TrendingUp size={18} />} />
      </div>

      {/* Score de confiance */}
      <div className="glass mb-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <p className="text-sm font-black">{t("profile", "trustScore")}</p>
          </div>
          <div className="text-right">
            <p className={`font-black ${level.color}`}>{trust}/100</p>
            <p className="text-[10px] text-[var(--muted)]">{levelLabel}</p>
          </div>
        </div>
        <ProgressBar value={trust} />
        {level.next !== null && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {nextPoints} {t("profile", "levelNext")} <span className="font-bold text-[var(--text)]">{nextLevelLabel}</span>.
          </p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[var(--muted)]">
          <div className="rounded-2xl bg-[var(--surface)] p-3">
            <p className="font-black text-[var(--text)]">{user.trustScore?.paymentReliability ?? 50}</p>
            {t("profile", "payment")}
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-3">
            <p className="font-black text-[var(--text)]">{user.trustScore?.communityRating ?? 50}</p>
            {t("profile", "community")}
          </div>
          <div className={`rounded-2xl bg-[var(--surface)] p-3 ${lateCount > 0 ? "ring-1 ring-rose-400/30" : ""}`}>
            <p className={`font-black ${lateCount > 0 ? "text-rose-400" : "text-[var(--text)]"}`}>{lateCount}</p>
            {t("profile", "late")}
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="glass mb-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black">
          <Flame size={18} className="text-orange-400" />
          {t("profile", "streak")}
        </div>
        {streak === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("profile", "noStreak")}</p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-orange-400">{streak}</p>
            <div className="text-right">
              <p className="text-sm font-bold">{streak > 1 ? t("profile", "streakMonths") : t("profile", "streakMonth")}</p>
              <p className="text-xs text-[var(--muted)]">
                {streak >= 12
                  ? t("profile", "badge12")
                  : streak >= 6
                  ? t("profile", "badge6")
                  : streak >= 3
                  ? t("profile", "badge3")
                  : t("profile", "badgeNext3").replace("{n}", String(3 - streak))}
              </p>
            </div>
          </div>
        )}
        {streak > 0 && (
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: Math.min(streak, 12) }).map((_, i) => (
              <div key={i} className="h-2 flex-1 rounded-full bg-orange-400/80" />
            ))}
            {Array.from({ length: Math.max(0, 12 - streak) }).map((_, i) => (
              <div key={i} className="h-2 flex-1 rounded-full bg-[var(--surface)]" />
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="glass mb-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black">
          <Fingerprint size={18} className="text-gold" />
          {t("profile", "badges")} ({user.badges.length})
        </div>
        {user.badges.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("profile", "noBadge")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.badges.map(({ badge }) => {
              const meta = badgeMeta(badge.code, lang);
              return (
                <span
                  key={badge.id}
                  title={meta.description}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${badgeColors[badge.color] ?? badgeColors.ivory}`}
                >
                  {meta.name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Sécurité */}
      <div className="glass mb-4 rounded-3xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-black mb-2">
          <KeyRound size={16} className="text-gold" />
          {t("profile", "security")}
        </div>
        <Link href="/forgot-password" className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--surface)] text-sm font-bold text-[var(--text)] transition hover:bg-[var(--surface-strong)]">
          {t("profile", "changePassword")}
        </Link>
        <Link href="/settings" className="flex min-h-11 items-center justify-between gap-2 rounded-2xl bg-[var(--surface)] px-4 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--surface-strong)]">
          <span className="flex items-center gap-2">⭐ {lang === "en" ? "Plan & Subscription" : "Plan & Abonnement"}</span>
          <span className="text-xs text-[var(--muted)]">→</span>
        </Link>
      </div>

      <div className="glass rounded-3xl p-2">
        <LogoutButton />
      </div>
    </MobileShell>
  );
}
