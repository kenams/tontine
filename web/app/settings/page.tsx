import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { DeleteAccountButton } from "@/components/app/delete-account-button";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { PushSubscribeButton } from "@/components/app/push-subscribe";
import { SettingsToggles } from "@/components/app/settings-toggles";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await requireUser();
  return (
    <MobileShell user={session} title="Paramètres">
      <PageHeading eyebrow="Compte" title="Paramètres">
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

      <div className="glass mt-3 rounded-3xl p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-smoke">Légal & RGPD</p>
        <div className="space-y-2">
          {[
            { href: "/legal/cgu", label: "Conditions Générales d'Utilisation" },
            { href: "/legal/confidentialite", label: "Politique de confidentialité" },
            { href: "/api/user/delete", label: "Exporter mes données (RGPD)", download: true },
          ].map((item) => (
            <Link key={item.href} href={item.href} target={item.download ? undefined : "_blank"}
              className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10">
              <span>{item.label}</span>
              <span className="text-smoke">→</span>
            </Link>
          ))}
          <DeleteAccountButton />
        </div>
      </div>
    </MobileShell>
  );
}
