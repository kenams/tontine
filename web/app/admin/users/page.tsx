import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { SearchBox } from "@/components/admin/search-box";
import { UserStatusActions } from "@/components/admin/user-status-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireAdmin();
  const { q = "" } = await searchParams;
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q } },
            { fullName: { contains: q } },
            { phone: { contains: q } }
          ]
        }
      : undefined,
    include: { wallet: true, trustScore: true, memberships: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AdminShell adminName={session.fullName}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gold">RBAC</p>
          <h1 className="mt-2 text-4xl font-black">Utilisateurs</h1>
          <p className="mt-2 text-sm text-smoke">Suspendre, bannir, revoir le statut et inspecter les profils.</p>
        </div>
        <div className="w-full max-w-md">
          <SearchBox placeholder="Nom, email, telephone" />
        </div>
      </div>
      <div className="glass overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-smoke">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Tontines</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.04]">
                  <td className="px-4 py-4">
                    <Link href={`/admin/users/${user.id}`} className="font-black text-emerald-400">{user.fullName}</Link>
                    <p className="text-xs text-smoke">{user.email}</p>
                  </td>
                  <td className="px-4 py-4">{user.role}</td>
                  <td className="px-4 py-4">{money(user.wallet?.balanceCents ?? 0, user.wallet?.currency ?? "XOF")}</td>
                  <td className="px-4 py-4">{user.trustScore?.score ?? 0}/100</td>
                  <td className="px-4 py-4">{user.memberships.length}</td>
                  <td className="px-4 py-4">
                    <UserStatusActions userId={user.id} status={user.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
