import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Tontine Mali en ligne — Tontine malienne digitale",
  description: "Gérez votre tontine malienne en ligne depuis la France. Orange Money Mali intégré. La diaspora malienne à Paris gère ses tontines avec Kotizy.",
  keywords: ["tontine mali", "tontine malienne en ligne", "tontine bamako diaspora", "orange money mali tontine", "epargne diaspora malienne"],
};

export default function TontineMaliPage() {
  return (
    <div className="min-h-dvh bg-[#080b07] text-white">
      <div className="mx-auto max-w-4xl px-5 py-20">
        <div className="mb-4 text-4xl">🇲🇱</div>
        <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-5xl">
          Tontine malienne<br />
          <span className="text-emerald-400">digitale pour la diaspora</span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg leading-7 text-white/55">
          La tontine est une pratique d'épargne collective profondément ancrée au Mali. Kotizy permet à la diaspora malienne en France de la pratiquer sans contrainte géographique.
        </p>
        <div className="mb-12 flex flex-wrap gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-black text-[#080b07] shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400">
            Créer ma tontine <ArrowRight size={16} />
          </Link>
          <a href="https://github.com/kenams/tontine/releases/download/v2.2.0/kotizy-v2.2.0.apk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-white/6 px-6 py-3 font-bold ring-1 ring-white/10 transition hover:bg-white/10">
            <Download size={15} /> APK Android
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Orange Money Mali", desc: "Recevez votre pot sur Orange Money directement à Bamako." },
            { title: "Madrid → Bamako", desc: "Gérez votre tontine depuis l'Espagne ou la France, recevez au Mali." },
            { title: "Zéro conflit", desc: "Paiements automatiques et traçables. Chaque membre voit tout en temps réel." },
            { title: "Groupes jusqu'à 20", desc: "Famille élargie, amis d'enfance — tous dans le même cercle Kotizy." },
          ].map(({ title, desc }) => (
            <div key={title} className="rounded-2xl bg-white/3 p-5 ring-1 ring-white/8">
              <p className="mb-1 font-black text-emerald-400">{title}</p>
              <p className="text-sm text-white/50">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/tontine-en-ligne" className="text-sm text-white/30 hover:text-white">← Toutes les communautés</Link>
        </div>
      </div>
    </div>
  );
}
