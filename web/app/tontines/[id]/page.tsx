import { AlertTriangle, CalendarClock, PiggyBank, ShieldCheck, Users } from "lucide-react";
import { getTierFromCents } from "@/lib/tiers";
import { notFound } from "next/navigation";

import { AutoPayToggle } from "@/components/app/autopay-toggle";
import { DebtAlert } from "@/components/app/debt-alert";
import { ExcludeMemberButton } from "@/components/app/exclude-member-button";
import { GroupSettingsPanel } from "@/components/app/group-settings-panel";
import { LeaveGroupButton } from "@/components/app/leave-group-button";
import { MessageComposer } from "@/components/app/message-composer";
import { MobileShell } from "@/components/app/mobile-shell";
import { ShareGroupButton } from "@/components/app/share-group";
import { PageHeading } from "@/components/app/page-heading";
import { ContributionButton, InviteMemberForm } from "@/components/app/payment-actions";
import { ProgressBar } from "@/components/app/progress-bar";
import { StatCard } from "@/components/app/stat-card";
import { StripeReturnSync } from "@/components/app/stripe-return-sync";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTontineDetail } from "@/lib/data";
import { calcMemberDebt } from "@/lib/defaults";
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
  const [detail, wallet, myMembership, myDebt] = await Promise.all([
    getTontineDetail(id, session.userId).catch(() => null),
    prisma.wallet.findUnique({ where: { userId: session.userId }, select: { balanceCents: true, currency: true } }),
    prisma.membership.findFirst({ where: { userId: session.userId, tontineGroupId: id } }),
    calcMemberDebt(session.userId, id),
  ]);
  if (!detail || (!detail.isMember && session.role !== "ADMIN")) notFound();
  const { group } = detail;
  const paid = group.contributions.filter((item) => item.status === "PAID").length;
  const progress = pct(paid, group.memberships.length || group.maxMembers);
  const late = group.memberships.filter((item) => item.status === "LATE").length;
  const isGroupAdmin = group.createdById === session.userId || session.role === "ADMIN";
  const activeMembers = group.memberships.filter((m) => !["LEFT", "EXCLUDED"].includes(m.status));

  return (
    <MobileShell user={session} title={group.name}>
      {(() => {
        const tier = getTierFromCents(group.contributionCents);
        return (
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black"
              style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
              {tier.emoji} Cercle {tier.name}
            </span>
            <span className="text-xs text-[var(--muted)]">{tier.origin} · {tier.tagline}</span>
          </div>
        );
      })()}
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

      {/* Alerte dette si applicable */}
      {myDebt > 0 && (
        <DebtAlert groupId={group.id} debtCents={myDebt} currency={group.currency} />
      )}

      <div className="mb-4 grid gap-3">
        <ContributionButton
          groupId={group.id}
          wallet={wallet}
          contributionCents={group.contributionCents}
          groupCurrency={group.currency}
        />
        {myMembership && (
          <AutoPayToggle
            groupId={group.id}
            initialEnabled={(myMembership as unknown as { autoPayEnabled: boolean }).autoPayEnabled}
            walletBalance={wallet?.balanceCents ?? 0}
            contributionCents={group.contributionCents}
            currency={group.currency}
          />
        )}
        <ShareGroupButton joinCode={group.joinCode} />
        <InviteMemberForm groupId={group.id} />
      </div>

      <div className="mb-4 glass rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black">Ordre de passage</p>
          <p className="text-xs text-[var(--muted)]">{activeMembers.length} actif{activeMembers.length > 1 ? "s" : ""}</p>
        </div>
        <div className="space-y-3">
          {group.memberships.map((membership) => {
            const mDebt = (membership as unknown as { debtCents?: number }).debtCents ?? 0;
            const hasLeft = ["LEFT", "EXCLUDED"].includes(membership.status);
            return (
              <div key={membership.id} className={`flex flex-wrap items-center justify-between gap-2 ${hasLeft ? "opacity-40" : ""}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-xs font-black overflow-hidden">
                    {(membership.user as unknown as { avatarUrl?: string | null }).avatarUrl
                      ? <img src={(membership.user as unknown as { avatarUrl: string }).avatarUrl} alt="" className="h-full w-full object-cover" />
                      : initials(membership.user.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{membership.payoutOrder}. {membership.user.fullName}</p>
                    <p className="text-xs text-smoke">
                      Score {membership.user.trustScore?.score ?? 0}/100
                      {mDebt > 0 && <span className="ml-1 text-gold">· Dette {money(mDebt, group.currency)}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={membership.status} />
                  {isGroupAdmin && !hasLeft && membership.userId !== session.userId && (
                    <ExcludeMemberButton
                      groupId={group.id}
                      membershipId={membership.id}
                      memberName={membership.user.fullName}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4 glass rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black">
          <ShieldCheck size={18} className="text-gold" />
          Règles &amp; Fonds de solidarité
        </div>
        <p className="text-sm leading-6 text-smoke">{group.rules}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-emerald-500/8 p-3 ring-1 ring-emerald-500/15">
            <p className="text-[10px] font-bold uppercase text-emerald-400/60">Fonds urgence</p>
            <p className="text-lg font-black text-emerald-400">{money(group.emergencyFund?.balanceCents ?? 0, group.currency)}</p>
            <p className="text-[10px] text-[var(--muted)]">Couvre les retards</p>
          </div>
          <div className="rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/8">
            <p className="text-[10px] font-bold uppercase text-[var(--muted)]">Exclusion auto</p>
            <p className="text-lg font-black">{(group as unknown as { autoExcludeDays?: number }).autoExcludeDays ?? 30}j</p>
            <p className="text-[10px] text-[var(--muted)]">Sans paiement</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          5% de chaque cotisation alimente le fonds. En cas de retard, le fonds avance la mise. Le membre doit rembourser sous 30 jours, sinon exclusion automatique.
        </p>
      </div>

      {/* Panel settings admin */}
      {isGroupAdmin && (
        <GroupSettingsPanel
          groupId={group.id}
          currency={group.currency}
          current={{
            minTrustScore: (group as unknown as { minTrustScore?: number }).minTrustScore ?? 0,
            requireFullPayment: (group as unknown as { requireFullPayment?: boolean }).requireFullPayment ?? false,
            autoExcludeDays: (group as unknown as { autoExcludeDays?: number }).autoExcludeDays ?? 30,
            latePenaltyCents: group.latePenaltyCents,
            emergencyFundBps: (group as unknown as { emergencyFundBps?: number }).emergencyFundBps ?? 500,
          }}
        />
      )}

      {/* Bouton quitter le groupe — visible pour les membres non-admin */}
      {detail.isMember && !isGroupAdmin && myMembership && !["LEFT", "EXCLUDED"].includes(myMembership.status) && (
        <div className="mb-4">
          <LeaveGroupButton groupId={group.id} groupName={group.name} />
        </div>
      )}

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
