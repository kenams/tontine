import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, CreditCard, Smartphone, WalletCards, Zap } from "lucide-react";
import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { TransactionActions } from "@/components/app/transaction-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";
import { getServerT } from "@/lib/i18n/server";
import { dateShort, money } from "@/lib/format";

export const revalidate = 0;

export default async function WalletPage({
  searchParams,
}: {
  searchParams?: Promise<{ deposit?: string }>;
}) {
  const session = await requireUser();
  const query = searchParams ? await searchParams : {};
  const { user, transactions } = await getUserDashboard(session.userId);
  const { t } = await getServerT();

  const wallet = user.wallet;
  const walletCurrency = wallet?.currency ?? "EUR";
  const balance = wallet?.balanceCents ?? 0;
  const paid = transactions
    .filter((tx) => tx.status === "PAID" && tx.type === "CONTRIBUTION")
    .reduce((s, tx) => s + tx.amountCents, 0);
  const deposited = transactions
    .filter((tx) => tx.status === "PAID" && tx.type === "WALLET_DEPOSIT")
    .reduce((s, tx) => s + tx.amountCents, 0);

  const TYPE_LABELS: Record<string, string> = {
    CONTRIBUTION:      t("wallet", "txContrib"),
    WALLET_DEPOSIT:    t("wallet", "txDeposit"),
    WALLET_WITHDRAWAL: t("wallet", "txWithdraw"),
    PAYOUT:            t("wallet", "txPayout"),
  };

  const DEPOSIT_METHODS = [
    {
      href: "/wallet/deposit",
      icon: CreditCard,
      label: t("wallet", "bankCard"),
      sub: t("wallet", "bankCardSub"),
      badge: t("wallet", "instant"),
      active: true,
    },
    {
      href: "/wallet/deposit?method=mobile",
      icon: Smartphone,
      label: "Mobile Money",
      sub: "Orange Money · MTN · Wave · Moov",
      badge: t("wallet", "instant"),
      active: true,
    },
  ];

  return (
    <MobileShell user={session} title={t("wallet", "title")}>
      <PageHeading eyebrow={t("wallet", "eyebrow")} title={money(balance, walletCurrency)}>
        {t("wallet", "balanceSub")}
      </PageHeading>

      {query.deposit === "success" && (
        <div className="mb-4 flex items-center gap-3 rounded-3xl border border-emerald-300/30 bg-emerald-400/10 p-4">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <p className="text-sm font-bold text-emerald-200">{t("wallet", "depositSuccessSub")}</p>
        </div>
      )}

      {/* Carte premium */}
      <div className="kotizy-card mb-4 rounded-[1.75rem] p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">Kotizy Black</p>
            <p className="mt-1 text-4xl font-black text-ivory">{money(balance, walletCurrency)}</p>
          </div>
          <WalletCards className="text-gold" size={26} />
        </div>
        <div className="mt-6 flex items-end justify-between">
          <p className="font-bold tracking-[0.18em] text-smoke/70">•••• 2026</p>
          <div className="text-right">
            <p className="text-xs font-bold text-smoke/70">{user.fullName}</p>
            <p className="text-xs text-smoke/50">{walletCurrency}</p>
          </div>
        </div>
      </div>

      {/* Actions principales */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Link href="/wallet/deposit" className="glass flex flex-col items-center gap-2 rounded-3xl p-4 transition hover:bg-[var(--surface-strong)] active:scale-95">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15">
            <ArrowDownToLine size={18} className="text-emerald-400" />
          </div>
          <span className="text-xs font-bold">{t("wallet", "deposit")}</span>
          <span className="text-[10px] font-bold text-emerald-400">{t("wallet", "depositSub")}</span>
        </Link>
        <Link href="/wallet/withdraw" className="glass flex flex-col items-center gap-2 rounded-3xl p-4 transition hover:bg-[var(--surface-strong)] active:scale-95">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <ArrowUpFromLine size={18} className="text-[var(--text)]" />
          </div>
          <span className="text-xs font-bold">{t("wallet", "withdraw")}</span>
          <span className="text-[10px] text-[var(--muted)]">{t("wallet", "withdrawSub")}</span>
        </Link>
      </div>

      {/* Méthodes de dépôt */}
      <div className="glass mb-4 rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">{t("wallet", "depositMethodsTitle")}</p>
        <div className="space-y-2">
          {DEPOSIT_METHODS.map((m) => {
            const Icon = m.icon;
            const Wrapper = m.href ? Link : "div";
            return (
              <Wrapper
                key={m.label}
                href={m.href ?? undefined}
                className={`flex items-center gap-3 rounded-2xl p-3 transition ${
                  m.active
                    ? "bg-emerald-500/8 ring-1 ring-emerald-400/20 hover:bg-emerald-500/12 cursor-pointer"
                    : "bg-[var(--surface)] opacity-60 cursor-not-allowed"
                }`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${m.active ? "bg-emerald-500/20" : "bg-[var(--surface-strong)]"}`}>
                  <Icon size={16} className={m.active ? "text-emerald-400" : "text-[var(--muted)]"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{m.label}</p>
                  <p className="text-xs text-[var(--muted)]">{m.sub}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${m.active ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--surface-strong)] text-[var(--muted)]"}`}>
                    {m.badge}
                  </span>
                  {m.active && <Zap size={12} className="text-emerald-400" />}
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="glass rounded-3xl p-4">
          <p className="mb-1 text-[10px] font-bold uppercase text-[var(--muted)]">{t("wallet", "totalPaid")}</p>
          <p className="text-xl font-black text-emerald-400">{money(paid, walletCurrency)}</p>
        </div>
        <div className="glass rounded-3xl p-4">
          <p className="mb-1 text-[10px] font-bold uppercase text-[var(--muted)]">{t("wallet", "deposited")}</p>
          <p className="text-xl font-black text-gold">{money(deposited, walletCurrency)}</p>
        </div>
      </div>

      {/* Historique transactions */}
      <div className="glass rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">{t("wallet", "history")}</p>
        {transactions.length === 0 ? (
          <div className="py-6 text-center">
            <WalletCards size={24} className="mx-auto mb-2 text-[var(--muted)]" />
            <p className="text-sm text-[var(--muted)]">{t("wallet", "noTxSub")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 12).map((tx) => {
              const isDeposit = tx.type === "WALLET_DEPOSIT";
              const isPayout = tx.type === "PAYOUT";
              const label = tx.tontineGroup?.name ?? TYPE_LABELS[tx.type] ?? tx.type;
              const sign = (isDeposit || isPayout) && tx.status === "PAID" ? "+" : "−";
              const amtColor = (isDeposit || isPayout) && tx.status === "PAID" ? "text-emerald-400" : "text-[var(--text)]";
              return (
                <div key={tx.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${tx.status === "PAID" ? "bg-emerald-500/15" : "bg-[var(--surface-strong)]"}`}>
                        <WalletCards size={15} className={tx.status === "PAID" ? "text-emerald-400" : "text-[var(--muted)]"} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{label}</p>
                        <p className="text-[10px] text-[var(--muted)]">{dateShort(tx.createdAt)} · {tx.provider}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${amtColor}`}>
                        {sign}{money(tx.amountCents, tx.currency)}
                      </p>
                      <StatusBadge value={tx.status} />
                    </div>
                  </div>
                  {tx.type === "WALLET_DEPOSIT" && (tx.status === "PENDING" || tx.status === "FAILED") && (
                    <TransactionActions
                      txId={tx.id}
                      status={tx.status}
                      provider={tx.provider}
                      amountCents={tx.amountCents}
                      currency={tx.currency}
                      reference={tx.reference}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
