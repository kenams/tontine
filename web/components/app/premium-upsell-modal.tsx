"use client";
import { Star, X, Zap, Users, BarChart3, Shield } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { PremiumCheckoutButton } from "./premium-checkout-button";

export function PremiumUpsellModal({ onClose }: { onClose: () => void }) {
  const { lang } = useLanguage();

  const features = lang === "en"
    ? ["Unlimited tontines (no 1-group limit)", "Up to 30 members per group", "Advanced stats & analytics", "Verified Premium badge", "Priority support"]
    : ["Tontines illimitées (plus de limite)", "Jusqu'à 30 membres par groupe", "Stats avancées & analytiques", "Badge Vérifié Premium", "Support prioritaire"];

  const icons = [Zap, Users, BarChart3, Shield, Star];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-t-[2rem] bg-[var(--bg)] p-6 ring-1 ring-white/10 sm:rounded-[2rem]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-xl bg-white/8 text-[var(--muted)] hover:bg-white/15">
          <X size={15} />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 ring-1 ring-amber-500/30">
            <Star size={22} className="text-amber-400" fill="currentColor" />
          </div>
          <div>
            <p className="font-black text-[var(--text)]">Kotizy Premium</p>
            <p className="text-sm text-[var(--muted)]">4,99€ / {lang === "en" ? "month" : "mois"}</p>
          </div>
        </div>

        <p className="mb-4 text-sm leading-6 text-[var(--muted)]">
          {lang === "en"
            ? "You've reached the free plan limit (1 active tontine). Upgrade to Premium to create unlimited groups and unlock all features."
            : "Vous avez atteint la limite du plan gratuit (1 tontine active). Passez Premium pour créer des groupes illimités et débloquer toutes les fonctionnalités."}
        </p>

        <div className="mb-5 space-y-2">
          {features.map((f, i) => {
            const Icon = icons[i];
            return (
              <div key={f} className="flex items-center gap-3 rounded-2xl bg-white/4 px-3 py-2 text-sm">
                <Icon size={15} className="shrink-0 text-emerald-400" />
                <span className="text-[var(--text)]">{f}</span>
              </div>
            );
          })}
        </div>

        <PremiumCheckoutButton />

        <p className="mt-3 text-center text-[10px] text-[var(--muted)]">
          {lang === "en" ? "Cancel anytime · Secure payment via Stripe" : "Résiliable à tout moment · Paiement sécurisé via Stripe"}
        </p>
      </div>
    </div>
  );
}
