"use client";

import { CreditCard, Send, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/context";

type WalletInfo = { balanceCents: number; currency: string } | null;

export function ContributionButton({
  groupId, wallet, contributionCents, groupCurrency,
}: {
  groupId: string; wallet?: WalletInfo; contributionCents?: number; groupCurrency?: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("WALLET");
  const [message, setMessage] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");

  const PROVIDERS = [
    { value: "WALLET",        label: t("payment", "walletOption") },
    { value: "STRIPE",        label: t("payment", "cardOption") },
    { value: "WAVE",          label: t("payment", "waveOption") },
    { value: "ORANGE_MONEY",  label: t("payment", "orangeOption") },
    { value: "MTN_MOMO",      label: t("payment", "mtnOption") },
    { value: "BANK_TRANSFER", label: t("payment", "bankOption") },
  ];

  const walletBalance = wallet?.balanceCents ?? 0;
  const walletCurrency = wallet?.currency ?? "EUR";
  const walletSuffix = walletBalance > 0
    ? `— ${(walletBalance / 100).toLocaleString("fr-FR", { style: "currency", currency: walletCurrency })}`
    : `— ${t("payment", "balance0")}`;
  const walletInsufficient =
    provider === "WALLET" &&
    groupCurrency &&
    wallet?.currency === groupCurrency &&
    contributionCents
      ? walletBalance < contributionCents
      : false;

  async function pay() {
    setLoading(true);
    setMessage(null);
    const response = await fetch(`/api/tontines/${groupId}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const result = await response.json().catch(() => null);
    setLoading(false);
    if (response.ok && result?.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    if (!response.ok) {
      setMessage(result?.error ?? t("payment", "errUnavailable"));
      setMsgType("err");
      return;
    }
    setMessage(result?.status === "PENDING" ? t("payment", "statusPending") : t("payment", "statusPaid"));
    setMsgType("ok");
    router.refresh();
  }

  return (
    <div className="glass rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black">{t("payment", "payTitle")}</p>
        <Link
          href="/wallet/deposit"
          className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition"
        >
          <WalletCards size={10} />
          {walletBalance > 0
            ? (walletBalance / 100).toLocaleString("fr-FR", { style: "currency", currency: walletCurrency })
            : t("payment", "rechargeWallet")}
        </Link>
      </div>

      {walletInsufficient && (
        <div className="mb-3 rounded-2xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-xs text-amber-300">
          {t("payment", "insufficientWallet")}{" "}
          <Link href="/wallet/deposit" className="font-bold underline">{t("payment", "recharge")}</Link>
        </div>
      )}

      <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
        <select
          value={provider}
          onChange={(e) => { setProvider(e.target.value); setMessage(null); }}
          className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.08] px-3 text-sm outline-none transition focus:border-emerald-400/40"
          style={{ colorScheme: "dark" }}
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.value === "WALLET" ? `${t("payment", "walletOption")} ${walletSuffix}` : p.label}
            </option>
          ))}
        </select>
        <Button disabled={loading} onClick={() => void pay()} className="px-4">
          {loading ? "…" : <CreditCard size={18} />}
        </Button>
      </div>

      {message && (
        <p className={`text-sm font-bold ${msgType === "err" ? "text-red-400" : "text-emerald-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export function InviteMemberForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/tontines/${groupId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(formData.get("email") ?? "") }),
    });
    setLoading(false);
    if (response.ok) { setSent(true); router.refresh(); }
  }

  return (
    <form onSubmit={onSubmit} className="glass rounded-3xl p-4">
      <p className="mb-3 text-sm font-black">{t("payment", "inviteTitle")}</p>
      <div className="flex gap-2">
        <Input name="email" type="email" placeholder={t("payment", "invitePh")} required />
        <Button type="submit" className="shrink-0 rounded-2xl px-3" aria-label={t("payment", "inviteTitle")} disabled={loading}>
          <Send size={18} />
        </Button>
      </div>
      {sent && <p className="mt-3 text-sm font-bold text-emerald-400">{t("payment", "inviteSent")}</p>}
    </form>
  );
}
