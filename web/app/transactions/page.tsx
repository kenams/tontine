import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { TransactionList } from "@/components/app/transaction-list";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerT } from "@/lib/i18n/server";

export default async function TransactionsPage() {
  const session = await requireUser();
  const { t } = await getServerT();
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    include: { tontineGroup: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <MobileShell user={session} title={t("txPage", "navTitle")}>
      <PageHeading eyebrow={t("txPage", "eyebrow")} title={t("txPage", "title")}>
        {t("txPage", "subtitle")}
      </PageHeading>
      <TransactionList transactions={transactions} />
    </MobileShell>
  );
}
