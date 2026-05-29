import { ArrowRight, CalendarClock, Globe, Lock, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { notFound } from "next/navigation";

import { MotionPage } from "@/components/ui/motion";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const group = await prisma.tontineGroup.findUnique({
    where: { joinCode: code.toUpperCase() },
    select: { name: true, description: true }
  });
  if (!group) return { title: "Groupe introuvable — Kotizy" };
  return {
    title: `${group.name} — Rejoindre sur Kotizy`,
    description: group.description
  };
}

export default async function PublicGroupPage({ params }: Props) {
  const { code } = await params;
  const group = await prisma.tontineGroup.findUnique({
    where: { joinCode: code.toUpperCase() },
    include: { memberships: { select: { id: true } } }
  });

  if (!group || !["ACTIVE", "OPEN"].includes(group.status)) notFound();

  const memberCount = group.memberships.length;
  const isFull = memberCount >= group.maxMembers;
  const freqLabel: Record<string, string> = { WEEKLY: "Hebdomadaire", BIWEEKLY: "Bi-mensuelle", MONTHLY: "Mensuelle" };

  return (
    <MotionPage>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--text)]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500 font-black text-ink">K</span>
          Kotizy
        </Link>

        <div className="glass rounded-[1.75rem] p-5">
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase text-gold">Invitation Kotizy</p>
            <h1 className="text-3xl font-black">{group.name}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{group.description}</p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Cotisation</p>
              <p className="font-black">{money(group.contributionCents, group.currency)}</p>
            </div>
            <div className="rounded-2xl bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Fréquence</p>
              <p className="font-black">{freqLabel[group.frequency] ?? group.frequency}</p>
            </div>
            <div className="rounded-2xl bg-[var(--surface)] p-3 flex items-center gap-2">
              <Users size={14} className="text-emerald-400" />
              <div>
                <p className="text-xs text-[var(--muted)]">Membres</p>
                <p className="font-black">{memberCount}/{group.maxMembers}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--surface)] p-3 flex items-center gap-2">
              <Globe size={14} className="text-gold" />
              <div>
                <p className="text-xs text-[var(--muted)]">Devise</p>
                <p className="font-black">{group.currency}</p>
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-2xl bg-[var(--surface)] p-3">
            <p className="mb-1 text-xs font-bold text-[var(--muted)]">Règles</p>
            <p className="text-sm leading-6">{group.rules}</p>
          </div>

          {isFull ? (
            <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300">
              Ce groupe est complet ({group.maxMembers}/{group.maxMembers} membres).
            </div>
          ) : (
            <Link
              href={`/login?next=/g/${code}`}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-base font-black text-ink shadow-glow"
            >
              Rejoindre ce groupe <ArrowRight size={20} />
            </Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            [Shield, "Sécurisé", "Bcrypt + HMAC"],
            [Lock, "Privé", "Code requis"],
            [CalendarClock, "Automatique", "Rounds auto"]
          ].map(([Icon, label, sub]) => {
            const I = Icon as React.ElementType;
            return (
            <div key={String(label)} className="glass rounded-3xl p-3">
              <I size={16} className="mx-auto mb-1 text-emerald-400" />
              <p className="text-xs font-black">{String(label)}</p>
              <p className="text-[10px] text-[var(--muted)]">{String(sub)}</p>
            </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Propulsé par{" "}
          <a href="https://kah-digital.ch" className="font-bold text-emerald-400">KAH Digital</a>
        </p>
      </main>
    </MotionPage>
  );
}
