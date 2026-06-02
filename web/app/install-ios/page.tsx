import { ArrowLeft, ArrowRight, Share, Plus, Smartphone } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Kotizy sur iPhone — Installation PWA" };

const STEPS = [
  {
    num: "1",
    icon: "🌐",
    title: "Ouvre Safari",
    desc: "Va sur tontineapp-web.vercel.app depuis Safari (pas Chrome, pas Firefox — Safari uniquement pour iOS).",
  },
  {
    num: "2",
    icon: "⬆️",
    title: 'Appuie sur "Partager"',
    desc: "En bas de Safari, appuie sur l'icône de partage (carré avec une flèche vers le haut).",
  },
  {
    num: "3",
    icon: "➕",
    title: '"Sur l\'écran d\'accueil"',
    desc: 'Fais défiler vers le bas dans le menu de partage et appuie sur "Sur l\'écran d\'accueil".',
  },
  {
    num: "4",
    icon: "✅",
    title: "Confirme l'installation",
    desc: 'Appuie sur "Ajouter" en haut à droite. Kotizy apparaît sur ton écran d\'accueil comme une vraie app.',
  },
];

export default function InstallIOSPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#080b07]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[100px]" />

      <main className="relative mx-auto max-w-lg px-5 py-8">

        {/* Nav */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition">
            <ArrowLeft size={16} /> Retour
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-sm font-black text-[#080b07]">K</span>
            <span className="text-sm font-black text-white">Kotizy</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-3xl ring-1 ring-white/10">
            🍎
          </div>
          <h1 className="text-3xl font-black text-white">Kotizy sur iPhone</h1>
          <p className="mt-3 text-white/50">
            Installe Kotizy en 30 secondes sur ton iPhone — sans App Store, gratuitement.
          </p>
        </div>

        {/* Étapes */}
        <div className="mb-8 space-y-3">
          {STEPS.map(({ num, icon, title, desc }) => (
            <div key={num} className="flex gap-4 rounded-3xl bg-white/3 p-5 ring-1 ring-white/8">
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-2xl bg-emerald-500/15 text-lg">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Étape {num}</span>
                </div>
                <p className="font-black text-white">{title}</p>
                <p className="mt-1 text-sm leading-5 text-white/50">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Avantages PWA */}
        <div className="mb-8 rounded-3xl bg-emerald-500/8 p-5 ring-1 ring-emerald-500/20">
          <p className="mb-3 text-sm font-black text-emerald-400">Ce que tu obtiens :</p>
          <div className="space-y-2">
            {[
              "✅ Icône sur l'écran d'accueil comme une vraie app",
              "✅ Fonctionne en plein écran (sans barre Safari)",
              "✅ Accès rapide à ton wallet et tes tontines",
              "✅ Gratuit, aucune inscription App Store",
            ].map((f) => (
              <p key={f} className="text-sm text-white/70">{f}</p>
            ))}
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://tontineapp-web.vercel.app"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-[#080b07] shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400"
        >
          <Smartphone size={18} /> Ouvrir dans Safari maintenant
        </a>

        <p className="mt-4 text-center text-xs text-white/25">
          Copie ce lien et ouvre-le dans Safari : tontineapp-web.vercel.app
        </p>

      </main>
    </div>
  );
}
