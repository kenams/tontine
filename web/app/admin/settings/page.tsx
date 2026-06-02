import { KeyRound, LockKeyhole, Server, Smartphone } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  const integrations = [
    ["Stripe", process.env.STRIPE_SECRET_KEY ? "ACTIVE" : "TEST_STUB", KeyRound],
    ["Orange Money", "TEST_STUB", Smartphone],
    ["MTN MoMo", "TEST_STUB", Smartphone],
    ["Wave", "TEST_STUB", Smartphone],
    ["CinetPay", process.env.CINETPAY_API_KEY ? "ACTIVE" : "NOT_CONFIGURED", Smartphone],
    ["OpenAI Coach", process.env.OPENAI_API_KEY ? "ACTIVE" : "TEST_STUB", Server],
    ["RBAC sessions", "ACTIVE", LockKeyhole]
  ];

  return (
    <AdminShell adminName={session.fullName}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-gold">Configuration</p>
        <h1 className="mt-2 text-4xl font-black">Paramètres admin</h1>
        <p className="mt-2 text-sm text-smoke">Etat des integrations et garde-fous de securite.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map(([name, status, Icon]) => (
          <div key={String(name)} className="glass rounded-3xl p-5">
            <Icon className="mb-4 text-emerald-400" size={22} />
            <div className="flex items-center justify-between gap-3">
              <p className="font-black">{String(name)}</p>
              <StatusBadge value={String(status)} />
            </div>
            <p className="mt-3 text-sm leading-6 text-smoke">
              {status === "ACTIVE" ? "Configure et pret pour un environnement controle." : "Architecture prete, cle reelle a connecter."}
            </p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
