import { AlertTriangle, CreditCard, Users, WalletCards } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { RealtimeMonitor } from "@/components/admin/realtime-monitor";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { getCachedAdminStats } from "@/lib/data";
import { compactMoney, dateShort, money } from "@/lib/format";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const stats = await getCachedAdminStats();
  const fraudRiskAverage = stats.alerts.length
    ? Math.round(stats.alerts.reduce((sum, alert) => sum + alert.riskScore, 0) / stats.alerts.length)
    : 12;

  return (
    <AdminShell adminName={session.fullName}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-gold">Backoffice fintech</p>
        <h1 className="mt-2 text-4xl font-black tracking-normal">Dashboard admin</h1>
        <p className="mt-2 text-sm text-smoke">Vue temps reel simulee: risques, paiements, groupes et revenus plateforme.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Utilisateurs" value={String(stats.totalUsers)} detail={`${stats.activeUsers} actifs`} icon={<Users size={20} />} />
        <AdminStatCard label="Tontines" value={String(stats.totalTontines)} detail={`${stats.activeTontines} groupes actifs`} icon={<WalletCards size={20} />} />
        <AdminStatCard label="Volume principal" value={compactMoney(stats.totalVolume, stats.totalVolumeCurrency)} detail={`${stats.volumeByCurrency.length} devises actives`} icon={<CreditCard size={20} />} />
        <AdminStatCard label="Alertes fraude" value={String(stats.alerts.length)} detail={`${stats.lateMemberships} retards`} icon={<AlertTriangle size={20} />} />
      </div>

      <div className="mb-6">
        <RealtimeMonitor
          compact
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

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <RevenueChart data={stats.chart} currency={stats.totalVolumeCurrency} />
        <div className="glass rounded-3xl p-5">
          <p className="mb-4 text-sm font-black">Operations critiques</p>
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/[0.08] p-4">
              <p className="text-xs text-smoke">Revenus plateforme</p>
              <p className="text-2xl font-black">{money(stats.platformRevenue, stats.totalVolumeCurrency)}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.08] p-4">
              <p className="text-xs text-smoke">Paiements en attente</p>
              <p className="text-2xl font-black text-gold">{stats.pendingTransactions}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.08] p-4">
              <p className="text-xs text-smoke">Paiements echoues</p>
              <p className="text-2xl font-black text-rose-300">{stats.failedTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <p className="mb-4 text-sm font-black">Transactions recentes</p>
          <div className="space-y-3">
            {stats.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{transaction.user.fullName}</p>
                  <p className="text-xs text-smoke">{transaction.reference} · {dateShort(transaction.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{money(transaction.amountCents, transaction.currency)}</p>
                  <StatusBadge value={transaction.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <p className="mb-4 text-sm font-black">Alertes fraude</p>
          <div className="space-y-3">
            {stats.alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl bg-white/[0.08] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-bold">{alert.title}</p>
                  <StatusBadge value={alert.status} />
                </div>
                <p className="text-sm text-smoke">{alert.user?.fullName ?? "Systeme"} · Risque {alert.riskScore}/100</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
