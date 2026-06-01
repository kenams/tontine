"use client";

import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

const APP_URL = "https://tontineapp-web.vercel.app";

export function ShareGroupButton({ joinCode, groupName = "ma tontine" }: { joinCode: string; groupName?: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const link = `${APP_URL}/g/${joinCode}`;
  const whatsappMsg = encodeURIComponent(
    `🤝 Rejoins *${groupName}* sur Kotizy !\nL'app de tontine pour la diaspora 🌍\n\n→ ${link}\nCode : *${joinCode}*`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMsg}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: `Rejoins ${groupName} sur Kotizy`,
        text: `🤝 Rejoins ${groupName} sur Kotizy, l'app de tontine pour la diaspora !`,
        url: link,
      });
    } else {
      await copy();
    }
  }

  return (
    <div className="glass rounded-3xl p-4">
      <p className="mb-2 text-xs font-bold uppercase text-gold">{t("share", "title")}</p>

      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-3 py-2">
        <code className="flex-1 truncate text-xs font-bold text-emerald-400">
          {t("share", "codeLabel")} {joinCode}
        </code>
        <button type="button" onClick={copy} className="shrink-0 text-[var(--muted)] hover:text-[var(--text)] transition">
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366]/10 py-3 text-sm font-bold text-[#25D366] transition hover:bg-[#25D366]/20"
        >
          <MessageCircle size={16} />
          {t("share", "whatsapp")}
        </a>

        <button
          type="button"
          onClick={share}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
        >
          <Share2 size={16} />
          {t("share", "share")}
        </button>
      </div>
    </div>
  );
}
