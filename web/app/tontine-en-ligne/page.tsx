import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Shield, Users, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Tontine en ligne — Gérez votre tontine digitale | Kotizy",
  description: "Créez et gérez votre tontine en ligne gratuitement. Paiements sécurisés, notifications push, Mobile Money. La tontine digitale pour la diaspora africaine.",
  keywords: ["tontine en ligne", "tontine digitale", "tontine application", "tontine mobile", "epargne collective africaine"],
  openGraph: {
    title: "Tontine en ligne — Kotizy",
    description: "Gérez votre tontine digitalement. Gratuit, sécurisé, disponible partout.",
    url: "https://tontineapp-web.vercel.app/tontine-en-ligne",
  },
};

const COUNTRIES = [
  { name: "Cameroun", flag: "🇨🇲", href: "/tontine-en-ligne/cameroun", desc: "Njangi digital pour la diaspora camerounaise" },
  { name: "Côte d'Ivoire", flag: "🇨🇮", href: "/tontine-en-ligne/cote-divoire", desc: "Tontine ivoirienne en ligne sécurisée" },
  { name: "Sénégal", flag: "🇸🇳", href: "/tontine-en-ligne/senegal", desc: "Tontine sénégalaise & transferts Wave/Orange Money" },
  { name: "Mali", flag: "🇲🇱", href: "/tontine-en-ligne/mali", desc: "Tontine malienne digitale pour la diaspora" },
];

export default function TontineEnLignePage() {
  return (
    <div className="min-h-dvh bg-[#080b07] text-white">
      <div className="mx-auto max-w-4xl px-5 py-20">

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-4 py-2 text-xs font-bold text-emerald-400">
          <Zap size={13} /> Tontine en ligne — Kotizy
        </div>

        <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-6xl">
          La tontine en ligne<br />
          <span className="text-emerald-400">simple et sécurisée</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg leading-7 text-white/55">
          Kotizy digitalise la tontine traditionnelle africaine. Créez un cercle d'épargne avec vos proches, payez par carte ou Mobile Money, recevez votre pot automatiquement. Sans frais cachés.
        </p>

        <div className="mb-16 flex flex-wrap gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-black text-[#080b07] shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400">
            Créer ma tontine <ArrowRight size={16} />
          </Link>
          <a href="https://github.com/kenams/tontine/releases/download/v2.2.0/kotizy-v2.2.0.apk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-white/6 px-6 py-3 font-bold ring-1 ring-white/10 transition hover:bg-white/10">
            <Download size={15} /> APK Android
          </a>
        </div>

        <div className="mb-16 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Shield, title: "Paiements sécurisés", desc: "Stripe + CinetPay. Vos fonds sont protégés à chaque étape." },
            { icon: Users, title: "Jusqu'à 20 membres", desc: "Invitez famille et amis. Chacun reçoit son tour automatiquement." },
            { icon: Zap, title: "Notifications push", desc: "Rappels de paiement, confirmations, alertes — en temps réel." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl bg-white/3 p-6 ring-1 ring-white/8">
              <Icon size={20} className="mb-3 text-emerald-400" />
              <p className="mb-1 font-black">{title}</p>
              <p className="text-sm text-white/45">{desc}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-6 text-2xl font-black">Tontine par communauté</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {COUNTRIES.map(({ name, flag, href, desc }) => (
            <Link key={name} href={href} className="flex items-center gap-4 rounded-2xl bg-white/3 p-5 ring-1 ring-white/8 transition hover:bg-white/5 hover:ring-emerald-500/20">
              <span className="text-3xl">{flag}</span>
              <div>
                <p className="font-black">{name}</p>
                <p className="text-sm text-white/45">{desc}</p>
              </div>
              <ArrowRight size={16} className="ml-auto shrink-0 text-white/25" />
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-[2rem] bg-emerald-500/8 p-8 text-center ring-1 ring-emerald-500/20">
          <h2 className="mb-3 text-2xl font-black">Prêt à démarrer votre tontine en ligne ?</h2>
          <p className="mb-6 text-white/50">Gratuit · Sans carte bancaire · Prêt en 2 minutes</p>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3 font-black text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.35)] transition hover:bg-emerald-400">
            Commencer gratuitement <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
