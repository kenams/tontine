import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateShort, money, pct } from "@/lib/format";

export default async function AdminTontinesPage() {
  const session = await requireAdmin();
  const groups = await prisma.tontineGroup.findMany({
    include: { emergencyFund: true, memberships: { include: { user: true } }, contributions: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AdminShell adminName={session.fullName}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-gold">Operations groupe</p>
        <h1 className="mt-2 text-4xl font-black">Tontines</h1>
        <p className="mt-2 text-sm text-smoke">Membres, rotations, fonds urgence, retards et statut paiement.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => {
          const paid = group.contributions.filter((item) => item.status === "PAID").length;
          const progress = pct(paid, group.memberships.length || group.maxMembers);
          return (
            <div key={group.id} className="glass rounded-3xl p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Link href={`/tontines/${group.id}`} className="text-xl font-black text-emerald-400">{group.name}</Link>
                  <p className="mt-1 text-sm text-smoke">{group.joinCode} · {money(group.contributionCents, group.currency)} · {group.currency} · due {dateShort(group.nextDueAt)}</p>
                </div>
                <StatusBadge value={group.status} />
              </div>
              <ProgressBar value={progress} />
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-2xl bg-white/[0.08] p-3">
                  <p className="text-xs text-smoke">Membres</p>
                  <p className="font-black">{group.memberships.length}/{group.maxMembers}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.08] p-3">
                  <p className="text-xs text-smoke">Urgence</p>
                  <p className="font-black">{money(group.emergencyFund?.balanceCents ?? 0, group.currency)}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.08] p-3">
                  <p className="text-xs text-smoke">Retards</p>
                  <p className="font-black">{group.memberships.filter((item) => item.status === "LATE").length}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.memberships.map((membership) => (
                  <span key={membership.id} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-smoke ring-1 ring-white/10">
                    {membership.payoutOrder}. {membership.user.fullName}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
