import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateShort, initials } from "@/lib/format";

export default async function ChatPage() {
  const session = await requireUser();
  const memberships = await prisma.membership.findMany({
    where: { userId: session.userId },
    include: {
      tontineGroup: {
        include: {
          messages: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 1 },
          memberships: true
        }
      }
    }
  });

  return (
    <MobileShell user={session} title="Chat">
      <PageHeading eyebrow="Messages" title="Conversations">
        Acces rapide aux chats de vos groupes.
      </PageHeading>
      <div className="space-y-3">
        {memberships.map(({ tontineGroup }) => {
          const last = tontineGroup.messages[0];
          return (
            <Link key={tontineGroup.id} href={`/tontines/${tontineGroup.id}`} className="glass flex items-center gap-3 rounded-3xl p-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-sm font-black text-ink">
                {initials(tontineGroup.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-black">{tontineGroup.name}</p>
                  {last ? <p className="text-xs text-smoke">{dateShort(last.createdAt)}</p> : null}
                </div>
                <p className="truncate text-sm text-smoke">{last ? `${last.user.fullName}: ${last.content}` : "Aucun message"}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </MobileShell>
  );
}
