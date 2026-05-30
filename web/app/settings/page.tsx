import { LockKeyhole } from "lucide-react";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { PushSubscribeButton } from "@/components/app/push-subscribe";
import { SettingsToggles } from "@/components/app/settings-toggles";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await requireUser();
  return (
    <MobileShell user={session} title="Parametres">
      <PageHeading eyebrow="Compte" title="Parametres">
        Préférences, notifications et sécurité.
      </PageHeading>

      <div className="glass mb-3 flex items-center justify-between rounded-3xl p-4">
        <div>
          <p className="font-black">Mode sombre</p>
          <p className="text-sm text-smoke">Basculer entre dark et light.</p>
        </div>
        <ThemeToggle />
      </div>

      <PushSubscribeButton />

      <SettingsToggles />

      <div className="glass mt-3 rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <LockKeyhole size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-black">Sécurité</p>
            <p className="text-sm text-smoke">Cookie httpOnly · Bcrypt · RBAC · RLS Supabase</p>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
