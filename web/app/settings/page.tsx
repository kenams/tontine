import { Bell, LockKeyhole, Smartphone, ToggleRight } from "lucide-react";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await requireUser();
  return (
    <MobileShell user={session} title="Parametres">
      <PageHeading eyebrow="Compte" title="Parametres">
        Preferences locales et securite de session.
      </PageHeading>
      <div className="space-y-3">
        {[
          ["Notifications", "Rappels echeance, paiements et chat groupe.", Bell],
          ["Securite", "Session httpOnly, hash password et RBAC.", LockKeyhole],
          ["Mobile money", "Providers preconfigures en mode test.", Smartphone]
        ].map(([title, body, Icon]) => (
          <div key={String(title)} className="glass flex items-center gap-3 rounded-3xl p-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
              <Icon size={18} className="text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black">{String(title)}</p>
              <p className="text-sm text-smoke">{String(body)}</p>
            </div>
            <ToggleRight className="text-emerald-400" />
          </div>
        ))}
        <div className="glass flex items-center justify-between rounded-3xl p-4">
          <div>
            <p className="font-black">Mode sombre premium</p>
            <p className="text-sm text-smoke">Basculer dark/light.</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </MobileShell>
  );
}
