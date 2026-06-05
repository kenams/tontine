import { LockKeyhole, Star, Users, Gift, Zap, BarChart3, Shield } from "lucide-react";
import Link from "next/link";
import { DeleteAccountButton } from "@/components/app/delete-account-button";
import { PremiumCheckoutButton, PremiumPortalButton } from "@/components/app/premium-checkout-button";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { PushSubscribeButton } from "@/components/app/push-subscribe";
import { SettingsToggles } from "@/components/app/settings-toggles";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerT } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const session = await requireUser();
  const { t } = await getServerT();
  const userPlan = await prisma.user.findUnique({ where: { id: session.userId }, select: { plan: true } as never }) as { plan: string } | null;
  const isPremium = userPlan?.plan === "PREMIUM";

  const PREMIUM_FEATS = [
    { icon: Zap, label: t("settings", "premiumFeat1") },
    { icon: Users, label: t("settings", "premiumFeat2") },
    { icon: BarChart3, label: t("settings", "premiumFeat3") },
    { icon: Shield, label: t("settings", "premiumFeat4") },
  ];

  const LEGAL_LINKS = [
    { href: "/legal/cgu", label: t("common", "cgu") },
    { href: "/legal/confidentialite", label: t("common", "privacy") },
    { href: "/api/user/delete", label: t("settings", "exportData"), download: true },
  ];

  return (
    <MobileShell user={session} title={t("settings", "title")}>
      <PageHeading eyebrow={t("settings", "eyebrow")} title={t("settings", "title")}>
        {t("settings", "subtitle")}
      </PageHeading>

      {isPremium ? (
        <div className="glass mb-3 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/20">
              <Star size={18} className="text-amber-400" fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="font-black text-amber-400">{t("settings", "premiumActive")}</p>
              <p className="text-sm text-smoke">{t("settings", "premiumSub")}</p>
            </div>
            <PremiumPortalButton />
          </div>
        </div>
      ) : (
        <div className="glass mb-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 ring-1 ring-amber-500/30">
              <Star size={20} className="text-amber-400" fill="currentColor" />
            </div>
            <div>
              <p className="font-black text-[var(--text)]">{t("settings", "premiumCta")}</p>
              <p className="text-sm text-[var(--muted)]">{t("settings", "premiumPrice")}</p>
            </div>
          </div>
          <div className="mb-4 space-y-2">
            {PREMIUM_FEATS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2 text-sm">
                <Icon size={14} className="shrink-0 text-emerald-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <PremiumCheckoutButton />
          <p className="mt-2 text-center text-[10px] text-[var(--muted)]">{t("settings", "premiumCancel")}</p>
        </div>
      )}

      <Link href="/referral" className="glass mb-3 flex items-center gap-3 rounded-3xl p-4 transition hover:border-emerald-500/40">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
          <Gift size={18} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="font-black">{t("settings", "referral")}</p>
          <p className="text-sm text-smoke">{t("settings", "referralSub")}</p>
        </div>
        <span className="text-smoke">→</span>
      </Link>

      <Link href="/marketplace" className="glass mb-3 flex items-center gap-3 rounded-3xl p-4 transition hover:border-emerald-500/40">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
          <Users size={18} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="font-black">{t("settings", "marketplace")}</p>
          <p className="text-sm text-smoke">{t("settings", "marketplaceSub")}</p>
        </div>
        <span className="text-smoke">→</span>
      </Link>

      <div className="glass mb-3 flex items-center justify-between rounded-3xl p-4">
        <div>
          <p className="font-black">{t("settings", "darkMode")}</p>
          <p className="text-sm text-smoke">{t("settings", "darkModeSub")}</p>
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
            <p className="font-black">{t("settings", "securityTitle")}</p>
            <p className="text-sm text-smoke">Cookie httpOnly · Bcrypt · RBAC · RLS Supabase</p>
          </div>
        </div>
      </div>

      <div className="glass mt-3 rounded-3xl p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-smoke">{t("settings", "dangerZone")}</p>
        <div className="space-y-2">
          {LEGAL_LINKS.map((item) => (
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
