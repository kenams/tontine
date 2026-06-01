import { TrendingUp, Users, Wallet, Shield, Star, GitBranch } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return Math.round(((a - b) / b) * 100);
}

export default async function MetricsPage() {
  await requireAdmin();

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86_400_000);
  const d60 = new Date(now.getTime() - 60 * 86_400_000);
  const d7  = new Date(now.getTime() - 7 * 86_400_000);

  const [totalUsers, newUsers30, newUsersD30to60, activeUsers30, activeUsersD30to60,
    totalVol, vol30, vol60, revenue, rev30, totalGroups, activeGroups,
    excluded, totalMembers, premium, retBase, retActive, refs
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: d30 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: d60, lt: d30 } } }),
    prisma.transaction.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({ where: { status: "PAID", createdAt: { gte: d30 } }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({ where: { status: "PAID", createdAt: { gte: d60, lt: d30 } }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({ where: { type: "PLATFORM_FEE", status: "PAID" }, _sum: { amountCents: true } }),
    prisma.transaction.aggregate({ where: { type: "PLATFORM_FEE", status: "PAID", createdAt: { gte: d30 } }, _sum: { amountCents: true } }),
    prisma.tontineGroup.count(),
    prisma.tontineGroup.count({ where: { status: "ACTIVE" } }),
    prisma.membership.count({ where: { status: "EXCLUDED" } }),
    prisma.membership.count({ where: { status: { not: "LEFT" } } }),
    prisma.user.count({ where: { plan: "PREMIUM" } as never }),
    prisma.user.count({ where: { createdAt: { lt: d7 } } }),
    prisma.user.count({ where: { createdAt: { lt: d7 }, lastLoginAt: { gte: d7 } } }),
    (prisma.referral as never).count(),
  ]);

  const retRate = retBase > 0 ? Math.round((retActive / retBase) * 100) : 0;
  const defRate = totalMembers > 0 ? ((excluded / totalMembers) * 100).toFixed(1) : "0.0";

  const KPI = [
    { label: "Utilisateurs", value: totalUsers.toLocaleString("fr"), sub: `+${newUsers30} ce mois`, icon: Users, pctGrowth: pct(newUsers30, newUsersD30to60), color: "text-blue-400" },
    { label: "Actifs 30j", value: activeUsers30.toLocaleString("fr"), sub: `${retRate}% rétention`, icon: TrendingUp, pctGrowth: pct(activeUsers30, activeUsersD30to60), color: "text-emerald-400" },
    { label: "Volume total", value: money(totalVol._sum.amountCents ?? 0, "EUR"), sub: `${money(vol30._sum.amountCents ?? 0, "EUR")} ce mois`, icon: Wallet, pctGrowth: pct(vol30._sum.amountCents ?? 0, vol60._sum.amountCents ?? 0), color: "text-amber-400" },
    { label: "Revenus KAH", value: money(revenue._sum.amountCents ?? 0, "EUR"), sub: `${money(rev30._sum.amountCents ?? 0, "EUR")} ce mois`, icon: TrendingUp, pctGrowth: 0, color: "text-emerald-400" },
    { label: "Tontines actives", value: activeGroups.toString(), sub: `${totalGroups} total`, icon: GitBranch, pctGrowth: 0, color: "text-purple-400" },
    { label: "Premium", value: premium.toString(), sub: `${totalUsers > 0 ? Math.round(premium/totalUsers*100) : 0}% des users`, icon: Star, pctGrowth: 0, color: "text-amber-400" },
    { label: "Taux de défaut", value: `${defRate}%`, sub: `${excluded} exclus / ${totalMembers} membres`, icon: Shield, pctGrowth: 0, color: parseFloat(defRate) > 5 ? "text-red-400" : "text-emerald-400" },
    { label: "Parrainages", value: (refs as number).toString(), sub: "filleuls référencés", icon: Users, pctGrowth: 0, color: "text-blue-400" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Admin · Données investisseur</p>
          <h1 className="text-2xl font-black">Métriques KPI</h1>
          <p className="text-xs text-[var(--muted)]">Mis à jour : {now.toLocaleString("fr-FR")}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {KPI.map(k => (
            <div key={k.label} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <k.icon size={14} className={k.color} />
                <p className="text-xs text-[var(--muted)]">{k.label}</p>
              </div>
              <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-xs text-[var(--muted)]">{k.sub}</p>
              {k.pctGrowth !== 0 && (
                <p className={`mt-1 text-xs font-bold ${k.pctGrowth > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {k.pctGrowth > 0 ? "▲" : "▼"} {Math.abs(k.pctGrowth)}% vs mois précédent
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
          <p className="mb-3 text-sm font-black">KPIs Investisseur</p>
          <div className="space-y-2 text-sm">
            {[
              { label: "LTV estimée (revenus/user)", value: totalUsers > 0 ? money(Math.round(((revenue._sum.amountCents ?? 0) / totalUsers)), "EUR") : "0€" },
              { label: "ARPU annuel (30j × 12)", value: activeUsers30 > 0 ? money(Math.round(((rev30._sum.amountCents ?? 0) / activeUsers30) * 12), "EUR") : "0€" },
              { label: "Taux de churn proxy", value: `${100 - retRate}%` },
              { label: "Premium conversion", value: `${totalUsers > 0 ? Math.round(premium/totalUsers*100) : 0}%` },
            ].map(kpi => (
              <div key={kpi.label} className="flex items-center justify-between">
                <span className="text-[var(--muted)]">{kpi.label}</span>
                <span className="font-black">{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>

        <a
          href="/api/admin/metrics"
          target="_blank"
          className="mt-3 block w-full rounded-xl border border-[var(--card-border)] py-3 text-center text-sm font-bold transition hover:border-emerald-500"
        >
          Exporter JSON (pour dashboard externe)
        </a>
      </div>
    </div>
  );
}
