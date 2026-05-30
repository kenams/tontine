"use client";

import { ArrowDownToLine, ArrowUpFromLine, ReceiptText } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/status-badge";
import { dateTime, money } from "@/lib/format";

type Tx = {
  id: string;
  type: string;
  status: string;
  amountCents: number;
  currency: string;
  provider: string;
  reference: string;
  riskScore: number;
  createdAt: Date;
  tontineGroup: { name: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  CONTRIBUTION:       "Cotisation",
  WALLET_DEPOSIT:     "Dépôt wallet",
  WALLET_WITHDRAWAL:  "Retrait wallet",
};

const FILTERS = ["Tous", "PAID", "PENDING", "FAILED"] as const;
type Filter = typeof FILTERS[number];

function txIcon(type: string) {
  if (type === "WALLET_DEPOSIT")    return <ArrowDownToLine size={17} className="text-emerald-400" />;
  if (type === "WALLET_WITHDRAWAL") return <ArrowUpFromLine size={17} className="text-[var(--muted)]" />;
  return <ReceiptText size={17} className="text-emerald-400" />;
}

function txLabel(tx: Tx) {
  if (tx.tontineGroup) return tx.tontineGroup.name;
  return TYPE_LABELS[tx.type] ?? tx.type;
}

function txSign(tx: Tx) {
  if (tx.type === "WALLET_DEPOSIT")    return "+";
  if (tx.type === "WALLET_WITHDRAWAL") return "−";
  if (tx.status === "PAID")            return "−";
  return "";
}

function txAmountColor(tx: Tx) {
  if (tx.type === "WALLET_DEPOSIT" && tx.status === "PAID") return "text-emerald-400";
  if (tx.status === "PAID") return "text-[var(--text)]";
  return "text-[var(--muted)]";
}

export function TransactionList({ transactions }: { transactions: Tx[] }) {
  const [filter, setFilter] = useState<Filter>("Tous");

  const filtered = filter === "Tous"
    ? transactions
    : transactions.filter((t) => t.status === filter);

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => {
          const active = filter === f;
          const count  = f === "Tous" ? transactions.length : transactions.filter(t => t.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                active
                  ? "bg-emerald-500 text-ink"
                  : "bg-white/10 text-smoke ring-1 ring-white/10 hover:bg-white/15"
              }`}
            >
              {f} {count > 0 ? <span className="ml-1 opacity-70">{count}</span> : null}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <ReceiptText size={28} className="mx-auto mb-3 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">Aucune transaction {filter !== "Tous" ? filter : ""}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <div key={tx.id} className="glass rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                  {txIcon(tx.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-sm">{txLabel(tx)}</p>
                  <p className="text-[10px] text-[var(--muted)]">{dateTime(tx.createdAt)} · {tx.provider}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${txAmountColor(tx)}`}>
                    {txSign(tx)}{money(tx.amountCents, tx.currency)}
                  </p>
                  <StatusBadge value={tx.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
