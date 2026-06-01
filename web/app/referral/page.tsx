"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Users, Gift, Share2 } from "lucide-react";
import { MobileShell } from "@/components/app/mobile-shell";

type ReferralStats = {
  code: string;
  shareUrl: string;
  stats: { rewarded: number; pending: number; totalEarned: number };
};

export default function ReferralPage() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral").then(r => r.json()).then(setData);
  }, []);

  const copy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const share = () => {
    if (!data) return;
    if (navigator.share) {
      navigator.share({
        title: "Rejoins Kotizy !",
        text: `Rejoins-moi sur Kotizy, la tontine numérique pour la diaspora. Utilise mon lien pour créer ton compte 🟢`,
        url: data.shareUrl,
      });
    } else copy();
  };

  return (
    <MobileShell title="Parrainage">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Gagnez ensemble</p>
        <h1 className="text-2xl font-black">Parrainage</h1>
      </div>

      {/* Explication */}
      <div className="mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
        <p className="font-black text-emerald-400 mb-1">Comment ça marche ?</p>
        <div className="space-y-2 text-sm text-[var(--muted)]">
          <div className="flex gap-2"><span className="text-emerald-400 font-bold">1.</span><span>Partage ton lien à un ami</span></div>
          <div className="flex gap-2"><span className="text-emerald-400 font-bold">2.</span><span>Il crée son compte via ton lien</span></div>
          <div className="flex gap-2"><span className="text-emerald-400 font-bold">3.</span><span>Il fait son 1er dépôt ou cotisation</span></div>
          <div className="flex gap-2"><span className="text-emerald-400 font-bold">4.</span><span className="font-black text-white">Tu reçois 5€ sur ton wallet 🎁</span></div>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Filleuls actifs", value: data.stats.rewarded, icon: Users, color: "text-emerald-400" },
            { label: "En attente", value: data.stats.pending, icon: Gift, color: "text-amber-400" },
            { label: "Total gagné", value: `${(data.stats.totalEarned / 100).toFixed(0)}€`, icon: Gift, color: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Code + boutons */}
      {data && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
            <p className="text-xs text-[var(--muted)] mb-1">Ton code personnel</p>
            <p className="text-2xl font-black tracking-widest text-emerald-400">{data.code}</p>
          </div>

          <button
            onClick={share}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-ink shadow-glow transition hover:bg-emerald-400"
          >
            <Share2 size={16} /> Partager mon lien
          </button>

          <button
            onClick={copy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--card-border)] py-3 text-sm font-bold transition hover:border-emerald-500"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? "Copié !" : "Copier le lien"}
          </button>
        </div>
      )}
    </MobileShell>
  );
}
