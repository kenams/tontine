import { Plus } from "lucide-react";
import Link from "next/link";

import { JoinTontineForm } from "@/components/app/join-tontine-form";
import { MobileShell } from "@/components/app/mobile-shell";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserTontines } from "@/lib/data";
import { dateShort, money, pct } from "@/lib/format";
import { getTierFromCents } from "@/lib/tiers";

export default async function TontinesPage() {
  const session = await requireUser();
  const memberships = await getUserTontines(session.userId);

  return (
    <MobileShell user={session} title="Groupes">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Mes tontines</p>
          <h1 className="text-2xl font-black">Groupes</h1>
        </div>
        <Link
          href="/tontines/create"
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-ink shadow-glow transition hover:bg-emerald-400"
          aria-label="Créer"
        >
          <Plus size={16} /> Nouveau
        </Link>
      </div>

      <JoinTontineForm />

      {memberships.length === 0 ? (
        <div className="glass mt-4 rounded-3xl p-8 text-center">
          <p className="text-3xl mb-3">🤝</p>
          <p className="font-black">Aucun groupe pour l'instant</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Créez un cercle ou rejoignez-en un avec un code d'invitation.</p>
          <Link href="/tontines/create" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-ink shadow-glow">
            <Plus size={14} /> Créer mon premier groupe
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {memberships.map(({ tontineGroup, status }) => {
            const paid = tontineGroup.contributions.filter((c) => c.status === "PAID").length;
            const total = tontineGroup.memberships.length || tontineGroup.maxMembers;
            const progress = pct(paid, total);
            const tier = getTierFromCents(tontineGroup.contributionCents);
            return (
              <Link key={tontineGroup.id} href={`/tontines/${tontineGroup.id}`}
                className="block rounded-3xl p-5 transition hover:brightness-110"
                style={{ background: `linear-gradient(135deg, var(--surface) 0%, ${tier.bg} 100%)`, border: `1px solid ${tier.border}` }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-base font-black">{tontineGroup.name}</span>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                        style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                        {tier.emoji} {tier.name}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {money(tontineGroup.contributionCents, tontineGroup.currency)} · {tontineGroup.frequency}
                    </p>
                  </div>
                  <StatusBadge value={status} />
                </div>
                <ProgressBar value={progress} />
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-[var(--muted)]">
                  <span>{tontineGroup.memberships.length}/{tontineGroup.maxMembers} membres · {progress}% collecté</span>
                  <span>Dû {dateShort(tontineGroup.nextDueAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </MobileShell>
  );
}
