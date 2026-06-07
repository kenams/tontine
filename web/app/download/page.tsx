import { ArrowLeft, Download, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Télécharger Kotizy — Android & iPhone",
  description: "Télécharge l'app Kotizy gratuitement. APK Android direct ou installation PWA sur iPhone. Tontines digitales pour la diaspora africaine.",
  openGraph: {
    title: "Télécharger Kotizy — Tontine de la diaspora",
    description: "App disponible sur Android (APK direct) et iPhone (PWA). Gratuit, sans inscription App Store.",
    images: [{ url: "/og/download.png", width: 1200, height: 630 }],
  },
};

const APK_URL = "https://expo.dev/accounts/kenams/projects/kotizy/builds/77db9e6c-3ef3-49a8-8fe2-5f6028820fdd";
const WEB_URL = "https://tontineapp-web.vercel.app";

export default function DownloadPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#080b07]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/6 blur-[120px]" />

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
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-500 text-4xl shadow-[0_0_40px_rgba(34,197,94,0.35)]">
            💸
          </div>
          <h1 className="text-3xl font-black text-white">Télécharger Kotizy</h1>
          <p className="mt-3 text-white/50">
            La tontine digitale de la diaspora africaine. Gratuit, sécurisé, disponible maintenant.
          </p>
        </div>

        {/* Android */}
        <div className="mb-4 rounded-[1.75rem] bg-white/3 p-6 ring-1 ring-white/8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">🤖</div>
            <div>
              <p className="font-black text-white">Android</p>
              <p className="text-xs text-emerald-400">Téléchargement direct · Gratuit</p>
            </div>
          </div>
          <p className="mb-5 text-sm leading-6 text-white/50">
            APK officiel Kotizy. Compatible Android 8+ (2018 et ultérieur). Installe en 30 secondes.
          </p>
          <a
            href={APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-[#080b07] shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            <Download size={18} /> Télécharger l&apos;APK Android
          </a>
          <p className="mt-3 text-center text-[11px] text-white/25">
            Activer &quot;Sources inconnues&quot; dans les paramètres si demandé
          </p>
        </div>

        {/* iPhone */}
        <div className="mb-8 rounded-[1.75rem] bg-white/3 p-6 ring-1 ring-white/8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-2xl">🍎</div>
            <div>
              <p className="font-black text-white">iPhone</p>
              <p className="text-xs text-white/40">PWA · Sans App Store</p>
            </div>
          </div>
          <p className="mb-5 text-sm leading-6 text-white/50">
            Ouvre le site dans Safari, puis appuie sur &quot;Partager → Sur l&apos;écran d&apos;accueil&quot;. Kotizy s&apos;installe comme une vraie app.
          </p>
          <Link
            href="/install-ios"
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/8 py-4 text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/12 active:scale-[0.98]"
          >
            <Smartphone size={18} /> Guide d&apos;installation iPhone
          </Link>
        </div>

        {/* Web */}
        <div className="mb-8 rounded-[1.75rem] bg-emerald-500/8 p-5 ring-1 ring-emerald-500/20">
          <p className="mb-1 text-sm font-black text-emerald-400">Accès web direct</p>
          <p className="mb-4 text-sm text-white/50">Sans téléchargement — accède depuis n&apos;importe quel navigateur.</p>
          <a
            href={WEB_URL}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 py-3 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/25 transition hover:bg-emerald-500/20"
          >
            🌐 Ouvrir l&apos;app web
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { val: "100%", label: "Gratuit" },
            { val: "🔒", label: "Sécurisé" },
            { val: "€ XOF", label: "Multi-devise" },
          ].map(({ val, label }) => (
            <div key={label} className="rounded-2xl bg-white/3 py-4 ring-1 ring-white/6">
              <p className="text-lg font-black text-white">{val}</p>
              <p className="text-[10px] text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
