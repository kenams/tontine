"use client";

import { CreditCard, Send, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WalletInfo = { balanceCents: number; currency: string } | null;

const PROVIDERS = [
  { value: "WALLET",       label: "Wallet Kotizy" },
  { value: "STRIPE",       label: "Carte / Apple Pay / Google Pay" },
  { value: "WAVE",         label: "Wave (Afrique de l'Ouest)" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "MTN_MOMO",     label: "MTN MoMo" },
  { value: "BANK_TRANSFER",label: "Virement SEPA / SWIFT" },
];

export function ContributionButton({
  groupId,
  wallet,
  contributionCents,
  groupCurrency,
}: {
  groupId: string;
  wallet?: WalletInfo;
  contributionCents?: number;
  groupCurrency?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("WALLET");
  const [message, setMessage] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");

  const walletBalance = wallet?.balanceCents ?? 0;
  const walletCurrency = wallet?.currency ?? "EUR";
  const walletSuffix = walletBalance > 0
    ? `— ${(walletBalance / 100).toLocaleString("fr-FR", { style: "currency", currency: walletCurrency })}`
    : "— Solde 0";
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
      setMessage(result?.error ?? "Paiement indisponible.");
      setMsgType("err");
      return;
    }
    setMessage(result?.status === "PENDING" ? "En attente de confirmation." : "✅ Paiement enregistré.");
    setMsgType("ok");
    router.refresh();
  }

  return (
    <div className="glass rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black">Payer ma cotisation</p>
        <Link
          href="/wallet/deposit"
          className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition"
        >
          <WalletCards size={10} />
          {walletBalance > 0
            ? (walletBalance / 100).toLocaleString("fr-FR", { style: "currency", currency: walletCurrency })
            : "Recharger le wallet"}
        </Link>
      </div>

      {walletInsufficient && (
        <div className="mb-3 rounded-2xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-xs text-amber-300">
          Solde insuffisant pour payer via wallet.{" "}
          <Link href="/wallet/deposit" className="font-bold underline">Recharger →</Link>
        </div>
      )}

      <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
        <select
          value={provider}
          onChange={(e) => { setProvider(e.target.value); setMessage(null); }}
          className="min-h-11 rounded-2xl border border-white/10 px-3 text-sm outline-none transition focus:border-emerald-400/40"
          style={{ colorScheme: "dark" }}
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.value === "WALLET" ? `Wallet Kotizy ${walletSuffix}` : p.label}
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
      <p className="mb-3 text-sm font-black">Inviter un membre</p>
      <div className="flex gap-2">
        <Input name="email" type="email" placeholder="email@exemple.com" required />
        <Button type="submit" className="shrink-0 rounded-2xl px-3" aria-label="Inviter" disabled={loading}>
          <Send size={18} />
        </Button>
      </div>
      {sent && <p className="mt-3 text-sm font-bold text-emerald-400">✅ Invitation envoyée.</p>}
    </form>
  );
}
