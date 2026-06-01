"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Gift, Share2, Users } from "lucide-react";
import { MobileShell } from "@/components/app/mobile-shell";
import { useLanguage } from "@/lib/i18n/context";

type ReferralStats = {
  code: string;
  shareUrl: string;
  stats: { rewarded: number; pending: number; totalEarned: number };
};

type Session = { fullName: string; email: string; avatarUrl?: string | null };

export function ReferralClient({ user }: { user: Session }) {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

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
      navigator.share({ title: t("referral", "shareTitle"), text: t("referral", "shareText"), url: data.shareUrl });
    } else copy();
  };

  return (
    <MobileShell user={user} title={t("referral", "navTitle")}>
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{t("referral", "eyebrow")}</p>
        <h1 className="text-2xl font-black">{t("referral", "title")}</h1>
      </div>

      <div className="mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
        <p className="font-black text-emerald-400 mb-1">{t("referral", "howTitle")}</p>
        <div className="space-y-2 text-sm text-[var(--muted)]">
          <div className="flex gap-2"><span className="text-emerald-400 font-bold">1.</span><span>{t("referral", "step1")}</span></div>
          <div className="flex gap-2"><span className="text-emerald-400 font-bold">2.</span><span>{t("referral", "step2")}</span></div>
          <div className="flex gap-2"><span className="text-emerald-400 font-bold">3.</span><span>{t("referral", "step3")}</span></div>
          <div className="flex gap-2"><span className="text-emerald-400 font-bold">4.</span><span className="font-black text-white">{t("referral", "step4")}</span></div>
        </div>
      </div>

      {data && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: t("referral", "statActive"), value: data.stats.rewarded, color: "text-emerald-400" },
            { label: t("referral", "statPending"), value: data.stats.pending, color: "text-amber-400" },
            { label: t("referral", "statTotal"), value: `${(data.stats.totalEarned / 100).toFixed(0)}€`, color: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
            <p className="text-xs text-[var(--muted)] mb-1">{t("referral", "codeLabel")}</p>
            <p className="text-2xl font-black tracking-widest text-emerald-400">{data.code}</p>
          </div>

          <button onClick={share} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-ink shadow-glow transition hover:bg-emerald-400">
            <Share2 size={16} /> {t("referral", "btnShare")}
          </button>

          <button onClick={copy} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--card-border)] py-3 text-sm font-bold transition hover:border-emerald-500">
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? t("referral", "btnCopied") : t("referral", "btnCopy")}
          </button>
        </div>
      )}
    </MobileShell>
  );
}
