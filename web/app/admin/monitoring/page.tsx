import { AdminShell } from "@/components/admin/admin-shell";
import { RealtimeMonitor } from "@/components/admin/realtime-monitor";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/data";
import { money } from "@/lib/format";

export default async function AdminMonitoringPage() {
  const session = await requireAdmin();
  const stats = await getAdminStats();
  const fraudRiskAverage = stats.alerts.length
    ? Math.round(stats.alerts.reduce((sum, alert) => sum + alert.riskScore, 0) / stats.alerts.length)
    : 12;

  return (
    <AdminShell adminName={session.fullName}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-gold">Operations globales</p>
        <h1 className="mt-2 text-4xl font-black tracking-normal">Monitoring temps reel</h1>
        <p className="mt-2 max-w-3xl text-sm text-smoke">
          Supervision live des paiements, risques, groupes actifs et signaux multi-devises. Le mode local simule les evenements et garde la meme interface que la production.
        </p>
      </div>

      <div className="mb-6">
        <RealtimeMonitor
          initialMetrics={{
            onlineUsers: stats.activeUsers + 18,
            onlineAdmins: 1,
            paymentsPerMinute: Math.max(4, stats.pendingTransactions + stats.failedTransactions + 6),
            fraudRiskAverage,
            pendingPayments: stats.pendingTransactions,
            failedPayments: stats.failedTransactions,
            activeGroups: stats.activeTontines,
            latencyMs: 42
          }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <p className="mb-4 text-sm font-black">Devises actives</p>
          <div className="space-y-3">
            {stats.volumeByCurrency.map((item) => (
              <div key={item.currency} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.08] px-4 py-3">
                <div>
                  <p className="font-black">{item.currency}</p>
                  <p className="text-xs text-smoke">Volume net demo</p>
                </div>
                <p className="text-sm font-black text-emerald-300">{money(item.amount, item.currency)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <p className="mb-4 text-sm font-black">Files de surveillance</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.08] px-4 py-3">
              <div>
                <p className="font-black">Fraude comportementale</p>
                <p className="text-xs text-smoke">Scoring local pret OpenAI</p>
              </div>
              <StatusBadge value={stats.alerts.length ? "OPEN" : "CLEAR"} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.08] px-4 py-3">
              <div>
                <p className="font-black">Paiements en attente</p>
                <p className="text-xs text-smoke">Stripe, Mobile Money, cartes</p>
              </div>
              <StatusBadge value={stats.pendingTransactions ? "PENDING" : "CLEAR"} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.08] px-4 py-3">
              <div>
                <p className="font-black">Retards cotisation</p>
                <p className="text-xs text-smoke">Relances et penalites</p>
              </div>
              <StatusBadge value={stats.lateMemberships ? "LATE" : "CLEAR"} />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
