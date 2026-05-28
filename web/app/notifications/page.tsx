import { BellRing } from "lucide-react";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateTime } from "@/lib/format";

export default async function NotificationsPage() {
  const session = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    include: { tontineGroup: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <MobileShell user={session} title="Notifications">
      <PageHeading eyebrow="Centre" title="Notifications">
        Rappels de cotisation, invitation, securite et activite.
      </PageHeading>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="glass rounded-3xl p-4">
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15">
                <BellRing size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-black">{notification.title}</p>
                <p className="mt-1 text-sm leading-6 text-smoke">{notification.body}</p>
                <p className="mt-2 text-xs text-smoke">{notification.tontineGroup?.name ?? notification.type} · {dateTime(notification.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
