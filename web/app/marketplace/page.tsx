import { Globe, Users, Calendar, Shield, Lock } from "lucide-react";
import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money, dateShort } from "@/lib/format";

export default async function MarketplacePage() {
  const session = await requireUser();

  const tontines = await prisma.tontineGroup.findMany({
    where: { isPublic: true, status: "ACTIVE" } as never,
    select: {
      id: true, name: true, description: true, contributionCents: true,
      currency: true, frequency: true, maxMembers: true, nextDueAt: true,
      minTrustScore: true, collateralRounds: true, joinCode: true,
      memberships: { where: { status: { in: ["ACTIVE", "LATE"] } }, select: { id: true } },
      createdBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  } as never) as Array<{
    id: string; name: string; description: string; contributionCents: number;
    currency: string; frequency: string; maxMembers: number; nextDueAt: Date;
    minTrustScore: number; collateralRounds: number; joinCode: string;
    memberships: { id: string }[]; createdBy: { fullName: string };
  }>;

  const freqLabel: Record<string, string> = { WEEKLY: "Hebdo", BIWEEKLY: "2x/mois", MONTHLY: "Mensuel" };

  return (
    <MobileShell user={session} title="Marketplace">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Tontines ouvertes</p>
        <h1 className="text-2xl font-black">Marketplace</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Rejoins une tontine existante sans code d'invitation</p>
      </div>

      {tontines.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-8 text-center">
          <Globe className="mx-auto mb-3 text-[var(--muted)]" size={32} />
          <p className="font-bold">Aucune tontine publique pour l&apos;instant</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Crée la tienne et active le mode public pour apparaître ici.</p>
          <Link href="/tontines/create" className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-ink">
            Créer une tontine
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {tontines.map(t => {
          const spots = t.maxMembers - t.memberships.length;
          const full = spots <= 0;
          return (
            <div key={t.id} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-black">{t.name}</p>
                  <p className="text-xs text-[var(--muted)]">par {t.createdBy.fullName}</p>
                </div>
                <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${full ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                  {full ? "Complet" : `${spots} place${spots > 1 ? "s" : ""}`}
                </span>
              </div>

              <p className="mb-3 text-sm text-[var(--muted)] line-clamp-2">{t.description}</p>

              <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="font-black text-white">{money(t.contributionCents, t.currency)}</span>
                  <span>/{freqLabel[t.frequency] ?? t.frequency}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Users size={12} />
                  <span>{t.memberships.length}/{t.maxMembers} membres</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Calendar size={12} />
                  <span>Prochain : {dateShort(t.nextDueAt)}</span>
                </div>
                {t.minTrustScore > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Shield size={12} />
                    <span>Score ≥ {t.minTrustScore}</span>
                  </div>
                )}
                {t.collateralRounds > 0 && (
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Lock size={12} />
                    <span>Collatéral {t.collateralRounds} mois</span>
                  </div>
                )}
              </div>

              {!full && (
                <Link
                  href={`/tontines?joinCode=${t.joinCode}&autoJoin=1`}
                  className="block w-full rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-black text-ink transition hover:bg-emerald-400"
                >
                  Rejoindre
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}
