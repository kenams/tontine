import { Filter, ReceiptText } from "lucide-react";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateTime, money } from "@/lib/format";

export default async function TransactionsPage() {
  const session = await requireUser();
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    include: { tontineGroup: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <MobileShell user={session} title="Transactions">
      <PageHeading eyebrow="Historique" title="Transactions">
        Cotisations, paiements en attente, echecs et risque comportemental.
      </PageHeading>
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {["Tous", "PAID", "PENDING", "FAILED"].map((item) => (
          <span key={item} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-smoke ring-1 ring-white/10">
            <Filter size={12} className="mr-1 inline" />
            {item}
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="glass rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
                  <ReceiptText size={18} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-black">{transaction.tontineGroup?.name ?? transaction.type}</p>
                  <p className="text-xs text-smoke">{transaction.reference}</p>
                  <p className="text-xs text-smoke">{dateTime(transaction.createdAt)} · Risque {transaction.riskScore}/100</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black">{money(transaction.amountCents, transaction.currency)}</p>
                <StatusBadge value={transaction.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
