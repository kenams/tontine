import { Award, ShieldCheck, TrendingUp, Users, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { ProgressBar } from "@/components/app/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { trustLevel } from "@/lib/trust";
import { initials, money } from "@/lib/format";

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

  // Chercher par slug email (partie avant @) ou par fullName slug
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { startsWith: decodeURIComponent(username) + "@" } },
        { fullName: { equals: decodeURIComponent(username).replace(/-/g, " "), mode: "insensitive" } },
      ],
    },
    include: {
      trustScore: true,
      badges: { include: { badge: true }, take: 6 },
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
  const level = trustLevel(trust);
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
          <span className="text-xs text-[var(--muted)]">Profil public</span>
        </div>

        {/* Carte identité */}
        <div className="glass mb-4 rounded-[1.75rem] p-6 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[1.5rem] bg-emerald-500 text-2xl font-black text-ink shadow-glow">
            {initials(user.fullName)}
          </div>
          <h1 className="text-2xl font-black">{user.fullName}</h1>
          <div className="mt-3 flex justify-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${trust >= 85 ? badgeColors.gold : badgeColors.emerald}`}>
              {level.label}
            </span>
            <StatusBadge value={user.status} />
          </div>
        </div>

        {/* Score confiance */}
        <div className="glass mb-4 rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span className="text-sm font-black">Score de confiance</span>
            </div>
            <span className={`text-2xl font-black ${level.color}`}>{trust}/100</span>
          </div>
          <ProgressBar value={trust} />
          <p className="mt-2 text-xs text-[var(--muted)]">
            Niveau <strong className="text-[var(--text)]">{level.label}</strong>
            {level.next !== null && ` · ${level.next - trust} pts pour ${trustLevel(level.next).label}`}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, label: "Cotisations", value: String(paidCount), color: "text-emerald-400" },
            { icon: Users, label: "Groupes actifs", value: String(user.memberships.length), color: "text-[var(--text)]" },
            { icon: Zap, label: "Ponctualité", value: `${onTimeRate}%`, color: trust >= 70 ? "text-emerald-400" : "text-gold" },
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
              <span className="text-sm font-black">Badges</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.badges.map(({ badge }) => (
                <span
                  key={badge.id}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${badgeColors[badge.color] ?? badgeColors.emerald}`}
                >
                  {badge.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Groupes actifs */}
        {user.memberships.length > 0 && (
          <div className="glass mb-4 rounded-3xl p-4">
            <p className="mb-3 text-sm font-black">Groupes actifs</p>
            <div className="space-y-2">
              {user.memberships.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="font-bold">{m.tontineGroup.name}</span>
                  <StatusBadge value={m.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sceau de confiance */}
        <div className="glass rounded-3xl p-4 text-center">
          <ShieldCheck size={20} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-xs text-[var(--muted)]">
            Score vérifié par Kotizy · Basé sur l'historique réel de paiements
          </p>
          <Link href="/register" className="mt-3 inline-block rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition">
            Rejoindre Kotizy →
          </Link>
        </div>

      </div>
    </div>
  );
}
