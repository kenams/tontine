import { MessageCircle, Plus } from "lucide-react";
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
      {memberships.length === 0 ? (
        <div className="glass mt-6 rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500/10">
            <MessageCircle size={28} className="text-emerald-400" />
          </div>
          <p className="font-black text-lg">Aucune conversation</p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-6">
            Le chat de groupe s'active automatiquement quand vous<br />créez ou rejoignez une tontine.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href="/tontines/create" className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-ink shadow-glow">
              <Plus size={15} /> Créer un cercle
            </Link>
            <Link href="/tontines" className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm font-bold ring-1 ring-[var(--surface-strong)]">
              Rejoindre
            </Link>
          </div>
        </div>
      ) : (
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
                  <p className="truncate text-sm text-smoke">
                    {last ? `${last.user.fullName}: ${last.content}` : "Aucun message — soyez le premier !"}
                  </p>
                </div>
                <MessageCircle size={16} className="shrink-0 text-[var(--muted)]" />
              </Link>
            );
          })}
        </div>
      )}
    </MobileShell>
  );
}
