import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Tontine Côte d'Ivoire en ligne — Tontine ivoirienne digitale",
  description: "Gérez votre tontine ivoirienne en ligne. Paiements Wave et Orange Money. La diaspora ivoirienne en France utilise Kotizy pour ses tontines digitales.",
  keywords: ["tontine cote d'ivoire", "tontine ivoirienne en ligne", "tontine abidjan diaspora", "wave tontine", "orange money tontine"],
};

export default function TontineCoteDIvoirePage() {
  return (
    <div className="min-h-dvh bg-[#080b07] text-white">
      <div className="mx-auto max-w-4xl px-5 py-20">
        <div className="mb-4 text-4xl">🇨🇮</div>
        <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-5xl">
          Tontine ivoirienne<br />
          <span className="text-emerald-400">digitale et sécurisée</span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg leading-7 text-white/55">
          La tontine est une tradition forte en Côte d'Ivoire. Kotizy la rend accessible depuis n'importe où. Payez depuis Paris ou Lyon, recevez sur Wave ou Orange Money à Abidjan.
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
            { title: "Wave & Orange Money", desc: "Recevez votre pot directement sur votre mobile money ivoirien. Bientôt disponible." },
            { title: "Paris → Abidjan", desc: "Membres en France, famille à Abidjan. Même cercle, même règles, zero friction." },
            { title: "Tontine par ordre de rotation", desc: "Définissez le calendrier de rotation librement. Chaque membre sait quand c'est son tour." },
            { title: "Suivi en temps réel", desc: "Tous les membres voient l'état des paiements. Transparence totale, confiance maximale." },
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
