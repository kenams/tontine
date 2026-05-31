"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";

type Withdrawal = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  metadata: string;
  createdAt: string;
  user: { id: string; email: string; fullName: string; phone?: string | null };
};

function statusBadge(status: string) {
  if (status === "PAID") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-1 text-xs font-bold text-emerald-400"><CheckCircle size={12} />Approuvé</span>;
  if (status === "FAILED") return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-2 py-1 text-xs font-bold text-rose-400"><XCircle size={12} />Refusé</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-1 text-xs font-bold text-amber-400"><Clock size={12} />En attente</span>;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    const res = await fetch("/api/admin/withdrawals");
    const data = await res.json() as { withdrawals: Withdrawal[] };
    setWithdrawals(data.withdrawals ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handle(id: string, action: "APPROVE" | "REJECT") {
    setProcessing(id);
    await fetch("/api/admin/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: id, action, note }),
    });
    setNote("");
    await load();
    setProcessing(null);
  }

  const pending = withdrawals.filter((w) => w.status === "PENDING");
  const done = withdrawals.filter((w) => w.status !== "PENDING");

  return (
    <AdminShell adminName="Admin">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-gold">Finance</p>
        <h1 className="mt-2 text-4xl font-black">Retraits wallet</h1>
        <p className="mt-2 text-sm text-smoke">
          {pending.length} en attente · {done.length} traités
        </p>
      </div>

      {loading && <p className="text-smoke">Chargement…</p>}

      {/* ── EN ATTENTE ── */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-black text-amber-400">⏳ En attente ({pending.length})</h2>
          <div className="space-y-4">
            {pending.map((w) => {
              const meta = JSON.parse(w.metadata ?? "{}") as { iban?: string; beneficiary?: string };
              return (
                <div key={w.id} className="glass rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-lg">{w.user.fullName}</p>
                      <p className="text-sm text-smoke">{w.user.email} · {w.user.phone ?? "—"}</p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {(w.amountCents / 100).toFixed(2)} {w.currency}
                      </p>
                      <p className="text-sm text-smoke">IBAN : {meta.iban ?? "—"}</p>
                      <p className="text-sm text-smoke">Bénéficiaire : {meta.beneficiary ?? "—"}</p>
                      <p className="text-xs text-smoke mt-1">{new Date(w.createdAt).toLocaleString("fr-FR")}</p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[220px]">
                      <input
                        className="rounded-xl bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-smoke"
                        placeholder="Note optionnelle (refus)…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <button
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-ink hover:bg-emerald-400 disabled:opacity-50"
                        disabled={processing === w.id}
                        onClick={() => void handle(w.id, "APPROVE")}
                      >
                        {processing === w.id ? "…" : "✓ Approuver — virement effectué"}
                      </button>
                      <button
                        className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-400 ring-1 ring-rose-500/20 hover:bg-rose-500/25 disabled:opacity-50"
                        disabled={processing === w.id}
                        onClick={() => void handle(w.id, "REJECT")}
                      >
                        ✕ Refuser — recréditer le wallet
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {pending.length === 0 && !loading && (
        <div className="mb-8 rounded-2xl bg-emerald-500/8 p-6 text-center ring-1 ring-emerald-500/15">
          <p className="font-black text-emerald-400">Aucun retrait en attente</p>
          <p className="text-sm text-smoke mt-1">Tout est à jour.</p>
        </div>
      )}

      {/* ── HISTORIQUE ── */}
      {done.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-black text-smoke">Historique ({done.length})</h2>
          <div className="overflow-hidden rounded-2xl ring-1 ring-white/8">
            <table className="w-full text-sm">
              <thead className="bg-white/4 text-xs font-bold uppercase text-smoke">
                <tr>
                  <th className="px-4 py-3 text-left">Utilisateur</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {done.map((w) => (
                  <tr key={w.id} className="hover:bg-white/3">
                    <td className="px-4 py-3 font-bold">{w.user.fullName}<br /><span className="text-xs text-smoke font-normal">{w.user.email}</span></td>
                    <td className="px-4 py-3 font-black">{(w.amountCents / 100).toFixed(2)} {w.currency}</td>
                    <td className="px-4 py-3">{statusBadge(w.status)}</td>
                    <td className="px-4 py-3 text-smoke">{new Date(w.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminShell>
  );
}
