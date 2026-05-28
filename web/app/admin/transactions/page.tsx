import { Download } from "lucide-react";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { SearchBox } from "@/components/admin/search-box";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateTime, money } from "@/lib/format";

export default async function AdminTransactionsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const session = await requireAdmin();
  const { q = "", status = "" } = await searchParams;
  const transactions = await prisma.transaction.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { reference: { contains: q } },
              { provider: { contains: q } },
              { user: { email: { contains: q } } },
              { user: { fullName: { contains: q } } }
            ]
          }
        : {})
    },
    include: { user: true, tontineGroup: true },
    orderBy: { createdAt: "desc" },
    take: 250
  });

  return (
    <AdminShell adminName={session.fullName}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gold">Flux financiers</p>
          <h1 className="mt-2 text-4xl font-black">Transactions</h1>
          <p className="mt-2 text-sm text-smoke">Recherche, filtres, risques, providers et export CSV.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
          <SearchBox placeholder="Reference, user, provider" />
          <Link href="/api/admin/transactions/export" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-ink">
            <Download size={17} />
            CSV
          </Link>
        </div>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {["", "PAID", "PENDING", "FAILED"].map((item) => (
          <Link key={item || "ALL"} href={item ? `/admin/transactions?status=${item}` : "/admin/transactions"} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-smoke ring-1 ring-white/10">
            {item || "TOUS"}
          </Link>
        ))}
      </div>
      <div className="glass overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-smoke">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Groupe</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Risque</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-white/[0.04]">
                  <td className="px-4 py-4 font-bold">{transaction.reference}</td>
                  <td className="px-4 py-4">{transaction.user.fullName}</td>
                  <td className="px-4 py-4">{transaction.tontineGroup?.name ?? "-"}</td>
                  <td className="px-4 py-4">{transaction.provider}</td>
                  <td className="px-4 py-4 font-black">{money(transaction.amountCents, transaction.currency)}</td>
                  <td className="px-4 py-4">{transaction.riskScore}/100</td>
                  <td className="px-4 py-4"><StatusBadge value={transaction.status} /></td>
                  <td className="px-4 py-4 text-smoke">{dateTime(transaction.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
