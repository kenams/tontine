import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { UserStatusActions } from "@/components/admin/user-status-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateTime, money } from "@/lib/format";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      trustScore: true,
      memberships: { include: { tontineGroup: true } },
      transactions: { include: { tontineGroup: true }, orderBy: { createdAt: "desc" }, take: 30 }
    }
  });
  if (!user) notFound();

  return (
    <AdminShell adminName={session.fullName}>
      <Link href="/admin/users" className="text-sm font-bold text-emerald-400">Retour utilisateurs</Link>
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="glass rounded-3xl p-5">
          <p className="text-xs font-bold uppercase text-gold">Profil</p>
          <h1 className="mt-2 text-3xl font-black">{user.fullName}</h1>
          <p className="text-sm text-smoke">{user.email}</p>
          <div className="mt-4">
            <UserStatusActions userId={user.id} status={user.status} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.08] p-4">
              <p className="text-xs text-smoke">Wallet</p>
              <p className="text-xl font-black">{money(user.wallet?.balanceCents ?? 0, user.wallet?.currency ?? "XOF")}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.08] p-4">
              <p className="text-xs text-smoke">Confiance</p>
              <p className="text-xl font-black">{user.trustScore?.score ?? 0}/100</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <p className="mb-4 text-sm font-black">Tontines</p>
          <div className="space-y-3">
            {user.memberships.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between rounded-2xl bg-white/[0.08] p-3">
                <div>
                  <p className="font-bold">{membership.tontineGroup.name}</p>
                  <p className="text-xs text-smoke">Ordre {membership.payoutOrder}</p>
                </div>
                <StatusBadge value={membership.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass mt-4 rounded-3xl p-5">
        <p className="mb-4 text-sm font-black">Transactions utilisateur</p>
        <div className="space-y-3">
          {user.transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{transaction.reference}</p>
                <p className="text-xs text-smoke">{transaction.tontineGroup?.name ?? transaction.type} · {dateTime(transaction.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-black">{money(transaction.amountCents, transaction.currency)}</p>
                <StatusBadge value={transaction.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
