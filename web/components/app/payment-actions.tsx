"use client";

import { CreditCard, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContributionButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("WALLET");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="glass rounded-3xl p-4">
      <p className="mb-3 text-sm font-black">Payer en 1 clic</p>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.08] px-3 text-sm outline-none"
        >
          <option value="WALLET">Wallet test</option>
          <option value="WAVE">Wave</option>
          <option value="ORANGE_MONEY">Orange Money</option>
          <option value="MTN_MOMO">MTN MoMo</option>
          <option value="FLUTTERWAVE">Flutterwave</option>
          <option value="STRIPE">Stripe Checkout</option>
          <option value="CARD_GLOBAL">Carte / Apple Pay / Google Pay</option>
          <option value="BANK_TRANSFER">SEPA / ACH / SWIFT</option>
        </select>
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setMessage(null);
            const response = await fetch(`/api/tontines/${groupId}/contribute`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider })
            });
            const result = await response.json().catch(() => null);
            setLoading(false);
            if (response.ok && result?.checkoutUrl) {
              window.location.assign(result.checkoutUrl);
              return;
            }
            if (!response.ok) {
              setMessage(result?.error ?? "Paiement indisponible.");
              return;
            }
            setMessage(result?.status === "PENDING" ? "Paiement en attente de confirmation." : "Paiement enregistre.");
            router.refresh();
          }}
        >
          <CreditCard size={18} />
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-smoke">{message}</p> : null}
    </div>
  );
}

export function InviteMemberForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSent(false);
    const response = await fetch(`/api/tontines/${groupId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(formData.get("email") ?? "") })
    });
    if (response.ok) {
      setSent(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass rounded-3xl p-4">
      <p className="mb-3 text-sm font-black">Inviter un membre</p>
      <div className="flex gap-2">
        <Input name="email" type="email" placeholder="email@exemple.com" required />
        <Button className="shrink-0 rounded-2xl px-3" aria-label="Inviter">
          <Send size={18} />
        </Button>
      </div>
      {sent ? <p className="mt-3 text-sm text-emerald-400">Invitation demo envoyee.</p> : null}
    </form>
  );
}
