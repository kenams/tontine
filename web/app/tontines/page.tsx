import { Plus } from "lucide-react";
import Link from "next/link";

import { JoinTontineForm } from "@/components/app/join-tontine-form";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserTontines } from "@/lib/data";
import { dateShort, money, pct } from "@/lib/format";

export default async function TontinesPage() {
  const session = await requireUser();
  const memberships = await getUserTontines(session.userId);

  return (
    <MobileShell user={session} title="Tontines">
      <div className="mb-4 flex items-start justify-between gap-3">
        <PageHeading eyebrow="Groupes" title="Mes tontines">
          Creation, rotation, cotisations et chat groupe.
        </PageHeading>
        <Link href="/tontines/create" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-ink shadow-glow" aria-label="Creer">
          <Plus size={20} />
        </Link>
      </div>
      <JoinTontineForm />
      <div className="mt-4 space-y-3">
        {memberships.map(({ tontineGroup, status }) => {
          const paid = tontineGroup.contributions.filter((item) => item.status === "PAID").length;
          const progress = pct(paid, tontineGroup.memberships.length || tontineGroup.maxMembers);
          return (
            <Link key={tontineGroup.id} href={`/tontines/${tontineGroup.id}`} className="glass block rounded-3xl p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black">{tontineGroup.name}</p>
                  <p className="text-sm text-smoke">
                    {money(tontineGroup.contributionCents, tontineGroup.currency)} · {tontineGroup.currency} · {tontineGroup.frequency}
                  </p>
                </div>
                <StatusBadge value={status} />
              </div>
              <ProgressBar value={progress} />
              <div className="mt-3 flex justify-between text-xs text-smoke">
                <span>{tontineGroup.memberships.length}/{tontineGroup.maxMembers} membres</span>
                <span>Due {dateShort(tontineGroup.nextDueAt)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </MobileShell>
  );
}
