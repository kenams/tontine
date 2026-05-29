"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareGroupButton({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${appUrl}/g/${joinCode}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "Rejoignez ma tontine sur Kotizy", url: link });
    } else {
      await copy();
    }
  }

  return (
    <div className="glass rounded-3xl p-4">
      <p className="mb-2 text-xs font-bold uppercase text-gold">Inviter des membres</p>
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-3 py-2">
        <code className="flex-1 truncate text-xs font-bold text-emerald-400">
          /g/{joinCode}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 text-[var(--muted)] hover:text-[var(--text)] transition"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <button
        type="button"
        onClick={share}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
      >
        <Share2 size={16} />
        Partager le lien d'invitation
      </button>
    </div>
  );
}
