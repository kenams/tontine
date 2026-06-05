import { Award, Flame, ShieldCheck, TrendingUp, Users, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { ProgressBar } from "@/components/app/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { trustLevel } from "@/lib/trust";
import { badgeMeta } from "@/lib/badges";
import { getServerT } from "@/lib/i18n/server";
import { initials } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findFirst({
    where: { email: { startsWith: decodeURIComponent(username) + "@" } },
    select: { fullName: true },
  });
  return { title: user ? `${user.fullName} — Kotizy` : "Profil Kotizy" };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { lang, t } = await getServerT();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { startsWith: decodeURIComponent(username) + "@" } },
        { fullName: { equals: decodeURIComponent(username).replace(/-/g, " "), mode: "insensitive" } },
      ],
    },
    include: {
      trustScore: true,
      badges: { include: { badge: true }, take: 8 },
      memberships: {
        where: { status: "ACTIVE" },
        include: { tontineGroup: { select: { name: true, currency: true } } },
        take: 5,
      },
      _count: { select: { contributions: { where: { status: "PAID" } } } },
    },
  });

  if (!user) notFound();

  const trust = user.trustScore?.score ?? 0;
  const streak = user.trustScore?.paymentStreak ?? 0;
  const level = trustLevel(trust);
  const levelLabel = lang === "en" ? level.labelEn : level.label;
  const paidCount = user._count.contributions;
  const onTimeRate = paidCount > 0
    ? Math.min(100, Math.round((trust + paidCount * 2) / (paidCount * 2 + 10) * 100))
    : 0;

  const badgeColors: Record<string, string> = {
    gold:    "bg-gold/15 text-gold ring-1 ring-gold/25",
    emerald: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25",
    ivory:   "bg-white/10 text-[var(--text)] ring-1 ring-white/10",
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="mx-auto max-w-sm">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-xs font-black text-ink">K</span>
            <span className="text-sm font-black">Kotizy</span>
          </Link>
          <span className="text-xs text-[var(--muted)]">{t("publicProfile", "publicLabel")}</span>
        </div>

        {/* Carte identité */}
        <div className="glass mb-4 rounded-[1.75rem] p-6 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[1.5rem] bg-emerald-500 text-2xl font-black text-ink shadow-glow">
            {initials(user.fullName)}
          </div>
          <h1 className="text-2xl font-black">{user.fullName}</h1>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${trust >= 85 ? badgeColors.gold : badgeColors.emerald}`}>
              {levelLabel}
            </span>
            <StatusBadge value={user.status} />
            {streak >= 3 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-400 ring-1 ring-orange-400/25">
                <Flame size={10} /> {streak}
              </span>
            )}
          </div>
        </div>

        {/* Score confiance */}
        <div className="glass mb-4 rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span className="text-sm font-black">{t("publicProfile", "trustScore")}</span>
            </div>
            <span className={`text-2xl font-black ${level.color}`}>{trust}/100</span>
          </div>
          <ProgressBar value={trust} />
          <p className="mt-2 text-xs text-[var(--muted)]">
            {lang === "en" ? "Level" : "Niveau"} <strong className="text-[var(--text)]">{levelLabel}</strong>
            {level.next !== null && ` · ${level.next - trust} ${lang === "en" ? "pts to" : "pts pour"} ${lang === "en" ? trustLevel(level.next).labelEn : trustLevel(level.next).label}`}
          </p>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="glass mb-4 rounded-3xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <Flame size={16} className="text-orange-400" />
              <span className="text-sm font-black">{t("publicProfile", "streak")}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-black text-orange-400">{streak}</p>
              <p className="text-sm text-[var(--muted)]">
                {lang === "en" ? `consecutive month${streak > 1 ? "s" : ""}` : `mois consécutif${streak > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: Math.min(streak, 12) }).map((_, i) => (
                <div key={i} className="h-2 flex-1 rounded-full bg-orange-400/80" />
              ))}
              {Array.from({ length: Math.max(0, 12 - streak) }).map((_, i) => (
                <div key={i} className="h-2 flex-1 rounded-full bg-[var(--surface)]" />
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, label: t("publicProfile", "contributions"), value: String(paidCount), color: "text-emerald-400" },
            { icon: Users, label: t("publicProfile", "groups"), value: String(user.memberships.length), color: "text-[var(--text)]" },
            { icon: Zap, label: t("publicProfile", "onTimeRate"), value: `${onTimeRate}%`, color: trust >= 70 ? "text-emerald-400" : "text-gold" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass rounded-3xl p-3 text-center">
              <Icon size={16} className={`mx-auto mb-1 ${color}`} />
              <p className={`text-lg font-black ${color}`}>{value}</p>
              <p className="text-[9px] font-bold uppercase text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        {user.badges.length > 0 && (
          <div className="glass mb-4 rounded-3xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <Award size={16} className="text-gold" />
              <span className="text-sm font-black">{t("publicProfile", "badges")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.badges.map(({ badge }) => {
                const meta = badgeMeta(badge.code, lang);
                return (
                  <span
                    key={badge.id}
                    title={meta.description}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${badgeColors[badge.color] ?? badgeColors.emerald}`}
                  >
                    {meta.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Groupes actifs — noms privés, seul le nombre est public */}
        {user.memberships.length > 0 && (
          <div className="glass mb-4 rounded-3xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-black">{t("publicProfile", "groups")}</span>
              <span className="text-lg font-black text-emerald-400">{user.memberships.length}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">{lang === "en" ? "Active tontine groups" : "Groupes de tontine actifs"}</p>
          </div>
        )}

        {/* Sceau Kotizy */}
        <div className="glass rounded-3xl p-4 text-center">
          <ShieldCheck size={20} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-xs font-bold mb-1">{t("publicProfile", "kotizySeal")}</p>
          <p className="text-xs text-[var(--muted)]">{t("publicProfile", "kotizySealSub")}</p>
          <Link href="/register" className="mt-3 inline-block rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition">
            {lang === "en" ? "Join Kotizy →" : "Rejoindre Kotizy →"}
          </Link>
        </div>

      </div>
    </div>
  );
}
