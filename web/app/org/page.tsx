import { Building2, Plus, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { MobileShell } from "@/components/app/mobile-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";

export default async function OrgPage() {
  const session = await requireUser();

  const orgs = await (prisma.organization as never).findMany({
    where: {
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    include: {
      members: { select: { id: true } },
      tontines: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  }) as Array<{
    id: string; name: string; type: string; slug: string; ownerId: string;
    revenueShareBps: number; totalVolumeCents: number; totalEarnedCents: number;
    members: { id: string }[]; tontines: { id: string }[];
  }>;

  const typeLabel: Record<string, string> = {
    ASSOCIATION: "Association",
    CHURCH: "Église",
    MOSQUE: "Mosquée",
    COMPANY: "Entreprise",
    COMMUNITY: "Communauté",
  };

  return (
    <MobileShell user={session} title="Organisations">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">B2B</p>
          <h1 className="text-2xl font-black">Organisations</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Gérez vos tontines sous votre enseigne et gagnez 0.25% sur chaque pot</p>
        </div>
        <Link
          href="/org/create"
          className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-ink shadow-glow"
        >
          <Plus size={14} /> Créer
        </Link>
      </div>

      {orgs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-8 text-center">
          <Building2 className="mx-auto mb-3 text-[var(--muted)]" size={32} />
          <p className="font-black">Aucune organisation</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Crée une organisation pour gérer des tontines sous ton enseigne et recevoir 0.25% de chaque pot distribué.
          </p>
          <Link href="/org/create" className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-ink">
            Créer mon organisation
          </Link>
        </div>
      )}

      {/* Comment ça marche */}
      {orgs.length === 0 && (
        <div className="mt-4 space-y-2">
          {[
            { step: "1", text: "Crée ton organisation (association, église, communauté...)" },
            { step: "2", text: "Lie tes tontines à l'organisation" },
            { step: "3", text: "Kotizy reverse 0.25% de chaque pot à ton wallet" },
            { step: "4", text: "Tes membres reçoivent un badge \"Membre [Nom Org]\"" },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] p-3 text-sm">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-xs font-black text-emerald-400">{s.step}</span>
              <span className="text-[var(--muted)]">{s.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {orgs.map(org => (
          <Link key={org.id} href={`/org/${org.id}`} className="block rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition hover:border-emerald-500/40">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-black">{org.name}</p>
                <p className="text-xs text-[var(--muted)]">{typeLabel[org.type] ?? org.type}</p>
              </div>
              <span className="rounded-xl bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-400">
                {(org.revenueShareBps / 100).toFixed(2)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-black text-white">{org.members.length}</p>
                <p className="text-[var(--muted)]">Membres</p>
              </div>
              <div>
                <p className="font-black text-white">{org.tontines.length}</p>
                <p className="text-[var(--muted)]">Tontines</p>
              </div>
              <div>
                <p className="font-black text-emerald-400">{money(org.totalEarnedCents, "EUR")}</p>
                <p className="text-[var(--muted)]">Gagné</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
