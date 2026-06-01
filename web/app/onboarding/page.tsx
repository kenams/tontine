import { ArrowRight, Shield, Star, TrendingUp, Users, WalletCards } from "lucide-react";
import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { requireUser } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";

export default async function OnboardingPage() {
  const session = await requireUser();
  const { t } = await getServerT();

  const steps = [
    { icon: WalletCards, color: "bg-emerald-500/15 text-emerald-400", title: t("onboarding", "step1Title"), body: t("onboarding", "step1Body") },
    { icon: Users,       color: "bg-gold/15 text-gold",               title: t("onboarding", "step2Title"), body: t("onboarding", "step2Body") },
    { icon: TrendingUp,  color: "bg-emerald-500/15 text-emerald-400", title: t("onboarding", "step3Title"), body: t("onboarding", "step3Body") },
    { icon: Star,        color: "bg-gold/15 text-gold",               title: t("onboarding", "step4Title"), body: t("onboarding", "step4Body") },
    { icon: Shield,      color: "bg-[var(--surface-strong)] text-[var(--muted)]", title: t("onboarding", "step5Title"), body: t("onboarding", "step5Body") },
  ];

  return (
    <MobileShell user={session} title={t("onboarding", "navTitle")}>
      <div className="pb-4">
        <div className="mb-6">
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-[1.25rem] bg-emerald-500 text-ink shadow-glow">
            <span className="text-2xl font-black">K</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{t("onboarding", "eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-black">{t("onboarding", "title")}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t("onboarding", "subtitle")}</p>
        </div>

        <div className="space-y-3">
          {steps.map(({ icon: Icon, color, title, body }) => (
            <div key={title} className="glass flex gap-4 rounded-3xl p-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${color}`}>
                <Icon size={19} />
              </div>
              <div className="min-w-0">
                <p className="font-black">{title}</p>
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="mt-6 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-base font-black text-ink shadow-glow transition hover:bg-emerald-400"
        >
          {t("onboarding", "btnDashboard")} <ArrowRight size={20} />
        </Link>
      </div>
    </MobileShell>
  );
}
