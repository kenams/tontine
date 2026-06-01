import { Globe, Users, Calendar, Shield, Lock } from "lucide-react";
import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerT } from "@/lib/i18n/server";
import { money, dateShort } from "@/lib/format";

export default async function MarketplacePage() {
  const session = await requireUser();
  const { t } = await getServerT();

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
  } as never) as unknown as Array<{
    id: string; name: string; description: string; contributionCents: number;
    currency: string; frequency: string; maxMembers: number; nextDueAt: Date;
    minTrustScore: number; collateralRounds: number; joinCode: string;
    memberships: { id: string }[]; createdBy: { fullName: string };
  }>;

  const freqLabel: Record<string, string> = {
    WEEKLY: t("marketplace", "weekly"),
    BIWEEKLY: t("marketplace", "biweekly"),
    MONTHLY: t("marketplace", "monthly"),
  };

  return (
    <MobileShell user={session} title={t("marketplace", "navTitle")}>
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{t("marketplace", "eyebrow")}</p>
        <h1 className="text-2xl font-black">{t("marketplace", "title")}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("marketplace", "subtitle")}</p>
      </div>

      {tontines.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-8 text-center">
          <Globe className="mx-auto mb-3 text-[var(--muted)]" size={32} />
          <p className="font-bold">{t("marketplace", "empty")}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("marketplace", "emptySub")}</p>
          <Link href="/tontines/create" className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-ink">
            {t("marketplace", "createBtn")}
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {tontines.map(g => {
          const spots = g.maxMembers - g.memberships.length;
          const full = spots <= 0;
          return (
            <div key={g.id} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-black">{g.name}</p>
                  <p className="text-xs text-[var(--muted)]">{t("marketplace", "by")} {g.createdBy.fullName}</p>
                </div>
                <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${full ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                  {full ? t("marketplace", "full") : `${spots} ${spots > 1 ? t("marketplace", "spotsPlural") : t("marketplace", "spots")}`}
                </span>
              </div>

              <p className="mb-3 text-sm text-[var(--muted)] line-clamp-2">{g.description}</p>

              <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <span className="font-black text-white">{money(g.contributionCents, g.currency)}</span>
                  <span>/{freqLabel[g.frequency] ?? g.frequency}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Users size={12} />
                  <span>{g.memberships.length}/{g.maxMembers} {t("marketplace", "members")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Calendar size={12} />
                  <span>{t("marketplace", "next")} {dateShort(g.nextDueAt)}</span>
                </div>
                {g.minTrustScore > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Shield size={12} />
                    <span>Score ≥ {g.minTrustScore}</span>
                  </div>
                )}
                {g.collateralRounds > 0 && (
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Lock size={12} />
                    <span>{t("marketplace", "collateral")} {g.collateralRounds} {t("marketplace", "month")}</span>
                  </div>
                )}
              </div>

              {!full && (
                <Link
                  href={`/tontines?joinCode=${g.joinCode}&autoJoin=1`}
                  className="block w-full rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-black text-ink transition hover:bg-emerald-400"
                >
                  {t("marketplace", "joinBtn")}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}
