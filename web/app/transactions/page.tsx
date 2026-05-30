import { ArrowDownToLine, ArrowUpFromLine, ReceiptText } from "lucide-react";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { TransactionList } from "@/components/app/transaction-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TransactionsPage() {
  const session = await requireUser();
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    include: { tontineGroup: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <MobileShell user={session} title="Transactions">
      <PageHeading eyebrow="Historique" title="Transactions">
        Cotisations, dépôts, retraits et paiements.
      </PageHeading>
      <TransactionList transactions={transactions} />
    </MobileShell>
  );
}
