import { AlertTriangle, Scale } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateTime, money } from "@/lib/format";

export default async function AdminAlertsPage() {
  const session = await requireAdmin();
  const [alerts, disputes] = await Promise.all([
    prisma.fraudAlert.findMany({ include: { user: true, tontineGroup: true }, orderBy: { createdAt: "desc" } }),
    prisma.dispute.findMany({ include: { user: true, tontineGroup: true }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <AdminShell adminName={session.fullName}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-gold">Securite</p>
        <h1 className="mt-2 text-4xl font-black">Alertes et litiges</h1>
        <p className="mt-2 text-sm text-smoke">Detection fraude simulee, suivi des risques et gestion des disputes.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <AlertTriangle size={18} className="text-gold" />
            Alertes fraude
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl bg-white/[0.08] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-black">{alert.title}</p>
                  <StatusBadge value={alert.status} />
                </div>
                <p className="text-sm leading-6 text-smoke">{alert.description}</p>
                <p className="mt-2 text-xs text-smoke">{alert.user?.fullName ?? "Systeme"} · {alert.tontineGroup?.name ?? "-"} · risque {alert.riskScore}/100</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black">
            <Scale size={18} className="text-emerald-400" />
            Litiges
          </div>
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="rounded-2xl bg-white/[0.08] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-black">{dispute.title}</p>
                  <StatusBadge value={dispute.status} />
                </div>
                <p className="text-sm text-smoke">{dispute.user.fullName} · {money(dispute.amountCents, dispute.currency)} · {dispute.priority}</p>
                <p className="mt-2 text-xs text-smoke">{dateTime(dispute.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
