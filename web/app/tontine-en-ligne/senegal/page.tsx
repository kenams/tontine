import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Tontine Sénégal en ligne — Tontine sénégalaise digitale",
  description: "Gérez votre tontine sénégalaise en ligne. Wave Money et Orange Money intégrés. La diaspora sénégalaise en France gère ses tontines avec Kotizy.",
  keywords: ["tontine senegal", "tontine sénégalaise en ligne", "tontine dakar diaspora", "wave senegal tontine", "epargne collective senegal"],
};

export default function TontineSenegalPage() {
  return (
    <div className="min-h-dvh bg-[#080b07] text-white">
      <div className="mx-auto max-w-4xl px-5 py-20">
        <div className="mb-4 text-4xl">🇸🇳</div>
        <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-5xl">
          Tontine sénégalaise<br />
          <span className="text-emerald-400">en ligne avec Wave & Orange Money</span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg leading-7 text-white/55">
          La tontine (ou "tour de table") est essentielle dans la culture sénégalaise. Avec Kotizy, gérez-la depuis Lyon, Paris ou Bordeaux, et recevez votre part directement sur Wave à Dakar.
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
            { title: "Wave Money natif", desc: "Recevez votre pot sur Wave directement. Le mode de paiement préféré au Sénégal." },
            { title: "Lyon → Dakar", desc: "Peu importe où se trouvent vos membres, la tontine continue sans interruption." },
            { title: "Rappels automatiques", desc: "Plus besoin de relancer manuellement. Kotizy envoie les rappels push à chaque échéance." },
            { title: "Historique partagé", desc: "Chaque paiement est visible par tous. Fin des malentendus et des conflits." },
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
