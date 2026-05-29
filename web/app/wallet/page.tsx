import { ArrowDownToLine, ArrowUpFromLine, Building2, CheckCircle2, CreditCard, Info, RefreshCw, Smartphone, WalletCards } from "lucide-react";
import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/data";
import { dateShort, money } from "@/lib/format";

const providers = [
  { name: "Revolut", icon: RefreshCw, desc: "Virement SEPA instantané", status: "Bientôt" },
  { name: "Stripe", icon: CreditCard, desc: "Carte Visa / Mastercard", status: "Actif" },
  { name: "Mobile Money", icon: Smartphone, desc: "Wave, Orange, MTN MoMo", status: "Bientôt" },
  { name: "Virement bancaire", icon: Building2, desc: "IBAN · SWIFT · SEPA", status: "Bientôt" },
];

export default async function WalletPage({
  searchParams,
}: {
  searchParams?: Promise<{ deposit?: string }>;
}) {
  const session = await requireUser();
  const query = searchParams ? await searchParams : {};
  const { user, transactions } = await getUserDashboard(session.userId);
  const wallet = user.wallet;
  const walletCurrency = wallet?.currency ?? "EUR";
  const balance = wallet?.balanceCents ?? 0;
  const paid = transactions.filter((t) => t.status === "PAID" && t.type !== "WALLET_DEPOSIT").reduce((s, t) => s + t.amountCents, 0);
  const pending = transactions.filter((t) => t.status === "PENDING").reduce((s, t) => s + t.amountCents, 0);

  return (
    <MobileShell user={session} title="Wallet">
      <PageHeading eyebrow="Wallet personnel" title={money(balance, walletCurrency)}>
        Solde disponible pour payer vos cotisations en 1 clic.
      </PageHeading>

      {query.deposit === "success" && (
        <div className="mb-4 flex items-center gap-3 rounded-3xl border border-emerald-300/30 bg-emerald-400/10 p-4">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <p className="text-sm font-bold text-emerald-200">Recharge confirmée. Les fonds sont disponibles sur votre wallet.</p>
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

      {/* Actions */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Link href="/wallet/deposit" className="glass flex flex-col items-center gap-2 rounded-3xl p-4 transition hover:bg-[var(--surface-strong)] active:scale-95">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15">
            <ArrowDownToLine size={18} className="text-emerald-400" />
          </div>
          <span className="text-xs font-bold">Déposer</span>
          <span className="text-[10px] text-emerald-400">Stripe</span>
        </Link>
        <button className="glass flex flex-col items-center gap-2 rounded-3xl p-4 transition hover:bg-[var(--surface-strong)] opacity-60 cursor-not-allowed">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--surface-strong)]">
            <ArrowUpFromLine size={18} className="text-[var(--muted)]" />
          </div>
          <span className="text-xs font-bold text-[var(--muted)]">Retirer</span>
          <span className="text-[10px] text-[var(--muted)]">Bientôt</span>
        </button>
      </div>

      {/* Info dépôt */}
      <div className="glass mb-4 flex gap-3 rounded-3xl p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-gold" />
        <div>
          <p className="text-sm font-bold">Comment alimenter votre wallet ?</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Transférez de l'argent depuis Revolut, votre banque ou un autre service vers votre wallet Kotizy. Les fonds sont ensuite disponibles pour payer vos cotisations en 1 clic, sans frais supplémentaires.
          </p>
        </div>
      </div>

      {/* Méthodes de dépôt */}
      <div className="glass mb-4 rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">Méthodes de dépôt</p>
        <div className="space-y-2">
          {providers.map((p) => {
            const Icon = p.icon;
            const active = p.status === "Actif";
            return (
              <div key={p.name} className={`flex items-center gap-3 rounded-2xl p-3 ${active ? "bg-emerald-500/8 ring-1 ring-emerald-400/20" : "bg-[var(--surface)]"}`}>
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-emerald-500/20" : "bg-[var(--surface-strong)]"}`}>
                  <Icon size={16} className={active ? "text-emerald-400" : "text-[var(--muted)]"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-xs text-[var(--muted)]">{p.desc}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--surface-strong)] text-[var(--muted)]"}`}>
                  {p.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="glass rounded-3xl p-4">
          <p className="mb-1 text-[10px] font-bold uppercase text-[var(--muted)]">Total cotisé</p>
          <p className="text-xl font-black text-emerald-400">{money(paid, walletCurrency)}</p>
        </div>
        <div className="glass rounded-3xl p-4">
          <p className="mb-1 text-[10px] font-bold uppercase text-[var(--muted)]">En attente</p>
          <p className="text-xl font-black text-gold">{money(pending, walletCurrency)}</p>
        </div>
      </div>

      {/* Historique */}
      <div className="glass rounded-3xl p-4">
        <p className="mb-3 text-sm font-black">Historique</p>
        {transactions.length === 0 ? (
          <div className="py-6 text-center">
            <WalletCards size={24} className="mx-auto mb-2 text-[var(--muted)]" />
            <p className="text-sm text-[var(--muted)]">Aucune transaction. Cotisez dans un groupe pour démarrer votre historique.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl ${tx.status === "PAID" ? "bg-emerald-500/15" : "bg-[var(--surface-strong)]"}`}>
                    <WalletCards size={15} className={tx.status === "PAID" ? "text-emerald-400" : "text-[var(--muted)]"} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{tx.tontineGroup?.name ?? tx.type}</p>
                    <p className="text-[10px] text-[var(--muted)]">{dateShort(tx.createdAt)} · {tx.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.status === "PAID" ? "text-emerald-400" : "text-[var(--text)]"}`}>
                    {tx.status === "PAID" ? "−" : ""}{money(tx.amountCents, tx.currency)}
                  </p>
                  <StatusBadge value={tx.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
