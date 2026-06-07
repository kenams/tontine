import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, Users, TrendingUp, ExternalLink, ArrowLeft } from "lucide-react";
import { MobileShell } from "@/components/app/mobile-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";

type OrgDetail = {
  id: string;
  name: string;
  type: string;
  slug: string;
  ownerId: string;
  revenueShareBps: number;
  totalVolumeCents: number;
  totalEarnedCents: number;
  description: string | null;
  website: string | null;
  members: { userId: string; role: string; user: { id: string; fullName: string; email: string; avatarUrl: string | null } }[];
  tontines: { tontineGroup: { id: string; name: string; contributionCents: number; currency: string; status: string; memberships: { id: string }[] } }[];
};

const typeLabel: Record<string, string> = {
  ASSOCIATION: "Association",
  CHURCH: "Église",
  MOSQUE: "Mosquée",
  COMPANY: "Entreprise",
  COMMUNITY: "Communauté",
};

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const org = await (prisma.organization as never).findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        },
      },
      tontines: {
        include: {
          tontineGroup: {
            select: { id: true, name: true, contributionCents: true, currency: true, status: true, memberships: { select: { id: true } } },
          },
        },
      },
    },
  }) as OrgDetail | null;

  if (!org) notFound();

  const isMember = org.members.some((m) => m.userId === session.userId);
  if (!isMember && session.role !== "ADMIN") notFound();

  const isOwner = org.ownerId === session.userId || session.role === "ADMIN";

  return (
    <MobileShell user={session} title={org.name}>
      <div className="mb-5 flex items-start gap-3">
        <Link href="/org" className="mt-1 text-[var(--muted)] hover:text-white transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            {typeLabel[org.type] ?? org.type}
          </span>
          <h1 className="text-2xl font-black">{org.name}</h1>
          {org.description && <p className="mt-1 text-sm text-[var(--muted)]">{org.description}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3 text-center">
          <p className="text-lg font-black text-emerald-400">{money(org.totalEarnedCents, "EUR")}</p>
          <p className="text-[10px] text-[var(--muted)]">Revenus</p>
        </div>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3 text-center">
          <p className="text-lg font-black">{org.tontines.length}</p>
          <p className="text-[10px] text-[var(--muted)]">Tontines</p>
        </div>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3 text-center">
          <p className="text-lg font-black">{org.members.length}</p>
          <p className="text-[10px] text-[var(--muted)]">Membres</p>
        </div>
      </div>

      {/* Revenue share info */}
      <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-400" />
          <span className="font-black text-emerald-400">Partage de revenus actif</span>
        </div>
        <p className="mt-1 text-[var(--muted)]">
          Volume total : <strong className="text-white">{money(org.totalVolumeCents, "EUR")}</strong> — taux : <strong className="text-white">{(org.revenueShareBps / 100).toFixed(2)}%</strong>
        </p>
      </div>

      {/* Tontines liées */}
      <div className="mb-4">
        <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-[var(--muted)]">Tontines</h2>
        {org.tontines.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Aucune tontine liée.</p>
        ) : (
          <div className="space-y-2">
            {org.tontines.map(({ tontineGroup: g }) => (
              <Link
                key={g.id}
                href={`/tontines/${g.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm hover:border-emerald-500/50 transition"
              >
                <span className="font-bold">{g.name}</span>
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <Users size={12} />
                  <span>{g.memberships.length}</span>
                  <ExternalLink size={12} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Membres */}
      <div className="mb-4">
        <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-[var(--muted)]">Membres</h2>
        <div className="space-y-2">
          {org.members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-xs font-black text-emerald-400">
                {m.user.fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold">{m.user.fullName}</p>
                <p className="truncate text-xs text-[var(--muted)]">{m.user.email}</p>
              </div>
              <span className="text-[10px] font-bold uppercase text-[var(--muted)]">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Website */}
      {org.website && (
        <a
          href={org.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-emerald-400 hover:underline"
        >
          <Building2 size={14} /> {org.website}
        </a>
      )}
    </MobileShell>
  );
}
