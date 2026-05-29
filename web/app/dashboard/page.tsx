import { CalendarClock, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AiCoachCard } from "@/components/app/ai-coach-card";
import { JoinTontineForm } from "@/components/app/join-tontine-form";
import { LivePulse } from "@/components/app/live-pulse";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { ProgressBar } from "@/components/app/progress-bar";
import { SavingsChart } from "@/components/app/savings-chart";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";
import { dateShort, money, pct } from "@/lib/format";

export default async function DashboardPage() {
  const session = await requireUser();
  if (session.role === "ADMIN") redirect("/admin");
  const { user, memberships, transactions, notifications, totalSaved, nextMembership } = await getUserDashboard(session.userId);
  const wallet = user.wallet;
  const walletCurrency = wallet?.currency ?? "XOF";
  const trust = user.trustScore?.score ?? 50;

  // Graphique épargne cumulée sur 6 mois
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("fr-FR", { month: "short" }) };
  });
  let cumul = 0;
  const chartData = months.map(({ key, label }) => {
    const monthTotal = transactions
      .filter((t) => t.status === "PAID" && t.currency === walletCurrency && t.createdAt.toISOString().startsWith(key))
      .reduce((s, t) => s + t.amountCents, 0);
    cumul += monthTotal;
    return { month: label, amount: Math.round(cumul / 100), currency: walletCurrency };
  });

  return (
    <MobileShell user={session} title="Accueil">
      <PageHeading eyebrow="Bonjour" title={user.fullName}>
        {nextMembership ? `Prochaine echeance ${nextMembership.name} le ${dateShort(nextMembership.nextDueAt)}.` : "Creez votre premiere tontine premium."}
      </PageHeading>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label={`Solde ${walletCurrency}`} value={money(wallet?.balanceCents ?? 0, walletCurrency)} icon={<WalletCards size={19} />} accent />
        <StatCard label="Confiance" value={`${trust}/100`} icon={<ShieldCheck size={19} />} />
        <StatCard label={`Epargne ${walletCurrency}`} value={money(totalSaved, walletCurrency)} icon={<TrendingUp size={19} />} />
        <StatCard label="Alertes" value={String(notifications.filter((item) => !item.readAt).length)} icon={<CalendarClock size={19} />} />
      </div>

      <LivePulse userId={session.userId} name={user.fullName} currency={walletCurrency} />

      <div className="mb-4 glass rounded-[1.75rem] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gold">Action rapide</p>
            <p className="text-xl font-black">{nextMembership?.name ?? "Nouvelle tontine"}</p>
          </div>
          {nextMembership ? <StatusBadge value={nextMembership.status} /> : null}
        </div>
        <p className="mb-4 text-sm leading-6 text-smoke">
          {nextMembership
            ? `${money(nextMembership.contributionCents, nextMembership.currency)} a payer avant ${dateShort(nextMembership.nextDueAt)}.`
            : "Creez un groupe ou rejoignez une communaute avec un code."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link href={nextMembership ? `/tontines/${nextMembership.id}` : "/tontines/create"} className="rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-black text-ink shadow-glow">
            {nextMembership ? "Payer" : "Creer"}
          </Link>
          <Link href="/tontines" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-[var(--text)] ring-1 ring-white/10">
            Voir groupes
          </Link>
        </div>
      </div>

      <JoinTontineForm />

      <div className="my-4 space-y-3">
        {memberships.slice(0, 3).map(({ tontineGroup }) => {
          const paid = tontineGroup.contributions.filter((item) => item.status === "PAID").length;
          const progress = pct(paid, tontineGroup.memberships.length || tontineGroup.maxMembers);
          return (
            <Link key={tontineGroup.id} href={`/tontines/${tontineGroup.id}`} className="glass block rounded-3xl p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{tontineGroup.name}</p>
                  <p className="text-xs text-smoke">{money(tontineGroup.contributionCents, tontineGroup.currency)} · {tontineGroup.memberships.length}/{tontineGroup.maxMembers} membres</p>
                </div>
                <StatusBadge value={tontineGroup.status} />
              </div>
              <ProgressBar value={progress} />
              <p className="mt-2 text-xs text-smoke">{progress}% du cycle finance</p>
            </Link>
          );
        })}
      </div>

      <AiCoachCard />

      <div className="mt-4">
        <SavingsChart data={chartData} />
      </div>

      <div className="mt-4 glass rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">Transactions récentes</p>
        <div className="space-y-3">
          {transactions.slice(0, 4).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{transaction.tontineGroup?.name ?? transaction.type}</p>
                <p className="text-xs text-smoke">{dateShort(transaction.createdAt)} · {transaction.provider}</p>
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
