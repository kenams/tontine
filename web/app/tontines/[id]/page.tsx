import { AlertTriangle, CalendarClock, PiggyBank, ShieldCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { MessageComposer } from "@/components/app/message-composer";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { ContributionButton, InviteMemberForm } from "@/components/app/payment-actions";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatCard } from "@/components/app/stat-card";
import { StripeReturnSync } from "@/components/app/stripe-return-sync";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getTontineDetail } from "@/lib/data";
import { dateShort, dateTime, initials, money, pct } from "@/lib/format";

export default async function TontineDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ payment?: string; session_id?: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const detail = await getTontineDetail(id, session.userId).catch(() => null);
  if (!detail || (!detail.isMember && session.role !== "ADMIN")) notFound();
  const { group } = detail;
  const paid = group.contributions.filter((item) => item.status === "PAID").length;
  const progress = pct(paid, group.memberships.length || group.maxMembers);
  const late = group.memberships.filter((item) => item.status === "LATE").length;

  return (
    <MobileShell user={session} title={group.name}>
      <PageHeading eyebrow={group.joinCode} title={group.name}>
        {group.description}
      </PageHeading>

      {query.payment === "success" ? (
        <div className="mb-4 rounded-3xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-200">
          Paiement Stripe recu. La cotisation est synchronisee automatiquement.
        </div>
      ) : null}

      <StripeReturnSync sessionId={query.session_id} />

      {query.payment === "cancelled" ? (
        <div className="mb-4 rounded-3xl border border-gold/30 bg-gold/10 p-4 text-sm font-bold text-gold">
          Paiement annule. Vous pouvez relancer Stripe, carte ou Mobile Money.
        </div>
      ) : null}

      <div className="mb-4 glass rounded-[1.75rem] p-4">
        <div className="mb-3 flex items-center justify-between">
          <StatusBadge value={group.status} />
          <p className="text-xs text-smoke">Round {group.currentRound}</p>
        </div>
        <p className="text-4xl font-black">{money(group.contributionCents, group.currency)}</p>
        <p className="mt-1 text-sm text-smoke">Prochaine cotisation le {dateShort(group.nextDueAt)}</p>
        <div className="mt-5">
          <ProgressBar value={progress} />
          <p className="mt-2 text-xs text-smoke">{progress}% du cycle collecte</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label="Membres" value={`${group.memberships.length}/${group.maxMembers}`} icon={<Users size={18} />} />
        <StatCard label="Retards" value={String(late)} icon={<AlertTriangle size={18} />} />
        <StatCard label="Urgence" value={money(group.emergencyFund?.balanceCents ?? 0, group.currency)} icon={<PiggyBank size={18} />} />
        <StatCard label="Penalite" value={money(group.latePenaltyCents, group.currency)} icon={<CalendarClock size={18} />} />
      </div>

      <div className="mb-4 grid gap-3">
        <ContributionButton groupId={group.id} />
        <InviteMemberForm groupId={group.id} />
      </div>

      <div className="mb-4 glass rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">Ordre de passage</p>
        <div className="space-y-3">
          {group.memberships.map((membership) => (
            <div key={membership.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-xs font-black">
                  {initials(membership.user.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{membership.payoutOrder}. {membership.user.fullName}</p>
                  <p className="text-xs text-smoke">Score {membership.user.trustScore?.score ?? 70}/100</p>
                </div>
              </div>
              <StatusBadge value={membership.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 glass rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black">
          <ShieldCheck size={18} className="text-gold" />
          Regles et fonds commun
        </div>
        <p className="text-sm leading-6 text-smoke">{group.rules}</p>
        <div className="mt-4 rounded-2xl bg-white/[0.08] p-3">
          <p className="text-xs text-smoke">Pret communautaire simule</p>
          <p className="text-lg font-black">{money(group.emergencyFund?.loanPoolCents ?? 0, group.currency)}</p>
        </div>
      </div>

      <div className="mb-4 glass rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">Timeline activite</p>
        <div className="space-y-3">
          {group.transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{transaction.user.fullName}</p>
                <p className="text-xs text-smoke">{dateTime(transaction.createdAt)} · {transaction.provider}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{money(transaction.amountCents, transaction.currency)}</p>
                <StatusBadge value={transaction.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 glass rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">Chat groupe</p>
        <div className="space-y-3">
          {group.messages.map((message) => (
            <div key={message.id} className="rounded-2xl bg-white/[0.08] p-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-emerald-400">{message.user.fullName}</p>
                <p className="text-[10px] text-smoke">{dateShort(message.createdAt)}</p>
              </div>
              <p className="text-sm leading-6">{message.content}</p>
            </div>
          ))}
        </div>
      </div>
      <MessageComposer groupId={group.id} />
    </MobileShell>
  );
}
