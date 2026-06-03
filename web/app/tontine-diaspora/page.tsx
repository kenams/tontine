import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Globe, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Tontine Diaspora Africaine — Envoyez de l'argent au pays | Kotizy",
  description: "Gérez votre tontine depuis la diaspora. Paris, Londres, Bruxelles, Genève → Abidjan, Dakar, Douala, Bamako. Mobile Money intégré. Gratuit.",
  keywords: ["tontine diaspora", "tontine africaine france", "tontine en ligne diaspora", "njangi diaspora cameroun", "epargne diaspora africaine"],
  openGraph: {
    title: "Tontine Diaspora — Kotizy",
    description: "La tontine digitale pour la diaspora africaine. Payez depuis l'Europe, recevez en Afrique.",
    url: "https://tontineapp-web.vercel.app/tontine-diaspora",
  },
};

const ROUTES = [
  { from: "Paris", to: "Abidjan", flag: "🇨🇮" },
  { from: "London", to: "Lagos", flag: "🇳🇬" },
  { from: "Lyon", to: "Dakar", flag: "🇸🇳" },
  { from: "Bruxelles", to: "Kinshasa", flag: "🇨🇩" },
  { from: "Genève", to: "Lomé", flag: "🇹🇬" },
  { from: "Madrid", to: "Bamako", flag: "🇲🇱" },
  { from: "Marseille", to: "Douala", flag: "🇨🇲" },
  { from: "Berlin", to: "Accra", flag: "🇬🇭" },
];

export default function TontineDiasporaPage() {
  return (
    <div className="min-h-dvh bg-[#080b07] text-white">
      <div className="mx-auto max-w-4xl px-5 py-20">

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-4 py-2 text-xs font-bold text-emerald-400">
          <Globe size={13} /> Diaspora africaine
        </div>

        <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-6xl">
          La tontine de la<br />
          <span className="text-emerald-400">diaspora africaine</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg leading-7 text-white/55">
          Vous êtes en Europe, votre famille est en Afrique. Kotizy vous permet de gérer votre tontine collective à distance. Payez par carte depuis l'Europe, recevez en Mobile Money au pays.
        </p>

        <div className="mb-12 flex flex-wrap gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-black text-[#080b07] shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400">
            Créer ma tontine <ArrowRight size={16} />
          </Link>
          <a href="https://github.com/kenams/tontine/releases/download/v2.2.0/kotizy-v2.2.0.apk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-white/6 px-6 py-3 font-bold ring-1 ring-white/10 transition hover:bg-white/10">
            <Download size={15} /> APK Android
          </a>
        </div>

        <h2 className="mb-4 text-xl font-black">Routes disponibles</h2>
        <div className="mb-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ROUTES.map(({ from, to, flag }) => (
            <div key={from} className="flex items-center gap-2 rounded-2xl bg-white/4 px-4 py-3 ring-1 ring-white/8">
              <span>{flag}</span>
              <span className="text-sm font-bold">{from}</span>
              <span className="text-emerald-400/60">→</span>
              <span className="text-sm text-white/55">{to}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Shield, title: "Paiements multi-devises", desc: "EUR, GBP, CHF → XOF, XAF, NGN. Conversion transparente." },
            { icon: Zap, title: "Mobile Money intégré", desc: "Orange Money, Wave, MTN disponibles dès validation KYC." },
            { icon: Globe, title: "Membres dispersés", desc: "Paris + Abidjan + Montréal dans le même cercle. Zéro friction." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl bg-white/3 p-6 ring-1 ring-white/8">
              <Icon size={20} className="mb-3 text-emerald-400" />
              <p className="mb-1 font-black">{title}</p>
              <p className="text-sm text-white/45">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[2rem] bg-emerald-500/8 p-8 text-center ring-1 ring-emerald-500/20">
          <h2 className="mb-2 text-2xl font-black">Rejoignez des milliers de familles</h2>
          <p className="mb-6 text-white/50">Paris, Londres, Bruxelles, Genève — ils font confiance à Kotizy</p>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3 font-black text-[#080b07] shadow-[0_0_20px_rgba(34,197,94,0.35)] transition hover:bg-emerald-400">
            Commencer gratuitement <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
