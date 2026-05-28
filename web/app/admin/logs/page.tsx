import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateTime } from "@/lib/format";

export default async function AdminLogsPage() {
  const session = await requireAdmin();
  const logs = await prisma.adminLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <AdminShell adminName={session.fullName}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-gold">Audit trail</p>
        <h1 className="mt-2 text-4xl font-black">Logs activite</h1>
        <p className="mt-2 text-sm text-smoke">Connexion, export, mutation admin et actions sensibles.</p>
      </div>
      <div className="glass overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-smoke">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Acteur</th>
                <th className="px-4 py-3">Cible</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-4 font-bold">{log.action}</td>
                  <td className="px-4 py-4">{log.actor?.email ?? "system"}</td>
                  <td className="px-4 py-4">{log.targetType}:{log.targetId ?? "-"}</td>
                  <td className="px-4 py-4">{log.ipAddress ?? "-"}</td>
                  <td className="px-4 py-4 text-smoke">{dateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
