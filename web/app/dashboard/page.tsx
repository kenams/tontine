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
import { getServerT } from "@/lib/i18n/server";
import { dateShort, money, pct } from "@/lib/format";

export const revalidate = 15;

export default async function DashboardPage() {
  const session = await requireUser();
  if (session.role === "ADMIN") redirect("/admin");
  const { user, memberships, transactions, notifications, totalSaved, nextMembership } = await getUserDashboard(session.userId);
  const { lang, t } = await getServerT();
  const wallet = user.wallet;
  const walletCurrency = wallet?.currency ?? "XOF";
  const trust = user.trustScore?.score ?? 0;

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

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <MobileShell user={session} title={t("nav", "home")}>
      {/* Greeting */}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{t("dashboard", "greeting")}</p>
        <h1 className="text-2xl font-black">{user.fullName}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {nextMembership
            ? `${t("dashboard", "nextDeadline")} : ${nextMembership.name} ${t("dashboard", "on")} ${dateShort(nextMembership.nextDueAt)}`
            : t("dashboard", "createFirst")}
        </p>
      </div>

      {/* Stats 2×2 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="glass col-span-2 flex items-center justify-between rounded-3xl p-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("dashboard", "walletBalance")} {walletCurrency}</p>
            <p className="text-2xl font-black">{money(wallet?.balanceCents ?? 0, walletCurrency)}</p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15">
            <WalletCards size={19} className="text-emerald-400" />
          </div>
        </div>
        <StatCard label={t("dashboard", "trust")} value={`${trust}/100`} icon={<ShieldCheck size={19} />} accent />
        <StatCard label={`${t("dashboard", "savings")} ${walletCurrency}`} value={money(totalSaved, walletCurrency)} icon={<TrendingUp size={19} />} />
        <StatCard label={t("dashboard", "groups")} value={String(memberships.length)} icon={<CalendarClock size={19} />} />
        <Link href="/notifications" className="glass flex items-center justify-between rounded-3xl p-4 transition hover:bg-[var(--surface-strong)]">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{t("dashboard", "alerts")}</p>
            <p className="text-xl font-black">{unread}</p>
          </div>
          {unread > 0 && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />}
        </Link>
      </div>

      <LivePulse userId={session.userId} name={user.fullName} currency={walletCurrency} />

      {/* Prochaine action */}
      <div className="mb-4 glass rounded-[1.75rem] p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold">{t("dashboard", "quickAction")}</p>
            <p className="text-xl font-black">{nextMembership?.name ?? t("dashboard", "getStarted")}</p>
          </div>
          {nextMembership && <StatusBadge value={nextMembership.status} />}
        </div>
        <p className="mb-4 text-sm leading-6 text-[var(--muted)]">
          {nextMembership
            ? `${money(nextMembership.contributionCents, nextMembership.currency)} · ${t("dashboard", "before")} ${dateShort(nextMembership.nextDueAt)}`
            : t("dashboard", "createOrJoin")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link href={nextMembership ? `/tontines/${nextMembership.id}` : "/tontines/create"}
            className="rounded-2xl bg-emerald-500 py-3 text-center text-sm font-black text-ink shadow-glow transition hover:bg-emerald-400">
            {nextMembership ? t("dashboard", "payNow") : t("dashboard", "createGroup")}
          </Link>
          <Link href="/tontines"
            className="rounded-2xl bg-[var(--surface)] py-3 text-center text-sm font-bold text-[var(--text)] ring-1 ring-[var(--surface-strong)] transition hover:bg-[var(--surface-strong)]">
            {t("dashboard", "myGroups")}
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
                  <p className="text-xs text-smoke">{money(tontineGroup.contributionCents, tontineGroup.currency)} · {tontineGroup.memberships.length}/{tontineGroup.maxMembers} {t("groups", "members")}</p>
                </div>
                <StatusBadge value={tontineGroup.status} />
              </div>
              <ProgressBar value={progress} />
              <p className="mt-2 text-xs text-smoke">{progress}% {t("dashboard", "cycleFinance")}</p>
            </Link>
          );
        })}
      </div>

      <AiCoachCard />

      <div className="mt-4">
        <SavingsChart data={chartData} />
      </div>

      <div className="mt-4 glass rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">{t("dashboard", "recentTx")}</p>

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
