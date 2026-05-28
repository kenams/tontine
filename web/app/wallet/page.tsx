import { CreditCard, Landmark, Smartphone, WalletCards } from "lucide-react";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";
import { dateShort, money } from "@/lib/format";

export default async function WalletPage() {
  const session = await requireUser();
  const { user, transactions } = await getUserDashboard(session.userId);
  const wallet = user.wallet;
  const walletCurrency = wallet?.currency ?? "XOF";

  return (
    <MobileShell user={session} title="Wallet">
      <PageHeading eyebrow={`Wallet test ${walletCurrency}`} title={money(wallet?.balanceCents ?? 0, walletCurrency)}>
        Architecture prete pour Stripe, cartes internationales, Orange Money, MTN MoMo, Wave et Flutterwave.
      </PageHeading>

      <div className="glass mb-4 rounded-[1.75rem] bg-emerald-500/15 p-5">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm font-bold text-smoke">TontineApp Black</p>
          <CreditCard className="text-gold" />
        </div>
        <p className="text-2xl font-black tracking-[0.18em]">•••• 2026</p>
        <div className="mt-8 flex justify-between text-xs text-smoke">
          <span>{user.fullName}</span>
          <span>{walletCurrency}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label="Mobile money" value="Pret" icon={<Smartphone size={18} />} />
        <StatCard label="Banque" value="Test" icon={<Landmark size={18} />} />
      </div>

      <div className="glass rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">Historique wallet</p>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
                  <WalletCards size={17} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{transaction.reference}</p>
                  <p className="text-xs text-smoke">{dateShort(transaction.createdAt)} · {transaction.provider}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{money(transaction.amountCents, transaction.currency)}</p>
                <StatusBadge value={transaction.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
