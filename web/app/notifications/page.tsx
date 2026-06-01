import { Award, Bell, BellRing, CreditCard, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { MobileShell } from "@/components/app/mobile-shell";
import { MarkAllReadButton } from "@/components/app/mark-all-read-button";
import { PageHeading } from "@/components/app/page-heading";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerT } from "@/lib/i18n/server";
import { dateTime } from "@/lib/format";

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  WELCOME:      { icon: BellRing, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  PAYMENT:      { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  PAYOUT:       { icon: TrendingUp, color: "text-gold", bg: "bg-gold/15" },
  BADGE:        { icon: Award, color: "text-gold", bg: "bg-gold/15" },
  DUE_REMINDER: { icon: BellRing, color: "text-rose-400", bg: "bg-rose-500/15" },
  FRAUD_ALERT:  { icon: ShieldCheck, color: "text-rose-400", bg: "bg-rose-500/15" },
  INVITE:       { icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/15" },
};

export default async function NotificationsPage() {
  const session = await requireUser();
  const { t } = await getServerT();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    include: { tontineGroup: true },
    orderBy: { createdAt: "desc" }
  });
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <MobileShell user={session} title={t("notifications", "title")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <PageHeading eyebrow={t("notifications", "eyebrow")} title={t("notifications", "title")}>
          {unreadCount > 0 ? `${unreadCount} ${t("notifications", "unread")}` : t("notifications", "allRead")}
        </PageHeading>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 && (
        <div className="glass rounded-3xl p-6 text-center">
          <Bell size={28} className="mx-auto mb-3 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">{t("notifications", "emptySub")}</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => {
          const cfg = typeConfig[notif.type] ?? typeConfig.WELCOME;
          const Icon = cfg.icon;
          const unread = !notif.readAt;
          return (
            <div
              key={notif.id}
              className={`glass rounded-3xl p-4 transition ${unread ? "ring-1 ring-emerald-400/20" : "opacity-75"}`}
            >
              <div className="flex gap-3">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-black leading-tight">{notif.title}</p>
                    {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{notif.body}</p>
                  <p className="mt-1.5 text-[10px] text-[var(--muted)]">
                    {notif.tontineGroup?.name ? `${notif.tontineGroup.name} · ` : ""}{dateTime(notif.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}
