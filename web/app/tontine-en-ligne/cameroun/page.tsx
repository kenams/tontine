import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Njangi en ligne Cameroun — Tontine digitale camerounaise | Kotizy",
  description: "Gérez votre Njangi en ligne. La tontine camerounaise digitalisée pour la diaspora. Paiements depuis Paris, Bruxelles, Genève vers Douala et Yaoundé.",
  keywords: ["njangi en ligne", "tontine camerounaise", "njangi digital", "tontine cameroun diaspora", "njangi application"],
};

export default function TontineCamerounPage() {
  return (
    <div className="min-h-dvh bg-[#080b07] text-white">
      <div className="mx-auto max-w-4xl px-5 py-20">
        <div className="mb-4 text-4xl">🇨🇲</div>
        <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-5xl">
          Njangi en ligne<br />
          <span className="text-emerald-400">pour la diaspora camerounaise</span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg leading-7 text-white/55">
          Le Njangi est au cœur de la culture camerounaise. Kotizy le digitalise : gérez votre Njangi depuis Paris, Bruxelles ou Genève, recevez votre pot à Douala ou Yaoundé via Mobile Money.
        </p>
        <div className="mb-12 flex flex-wrap gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-black text-[#080b07] shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400">
            Créer mon Njangi <ArrowRight size={16} />
          </Link>
          <a href="https://github.com/kenams/tontine/releases/download/v2.2.0/kotizy-v2.2.0.apk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-white/6 px-6 py-3 font-bold ring-1 ring-white/10 transition hover:bg-white/10">
            <Download size={15} /> APK Android
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Njangi traditionnel digitalisé", desc: "Conservez la logique du Njangi : tour de rôle, cotisation mensuelle, pas d'intérêts." },
            { title: "MTN Mobile Money", desc: "Recevez votre pot directement sur votre MTN MoMo. Bientôt disponible." },
            { title: "Membres en Europe et au pays", desc: "Paris + Douala dans le même groupe. Chacun paie dans sa devise." },
            { title: "Zéro conflit, zéro oubli", desc: "Paiements automatiques, rappels push, historique transparent pour tous." },
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
