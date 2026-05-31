import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n/translations";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Kotizy — La tontine de la diaspora",
    template: "%s | Kotizy",
  },
  description: "Épargnez ensemble en euros. Tontines digitales pour la diaspora africaine — wallet multi-devise, Wave, Orange Money, MTN MoMo. Gratuit, sécurisé, transparent.",
  keywords: ["tontine", "diaspora africaine", "épargne collective", "tontine digitale", "XOF", "EUR", "Wave", "Orange Money", "Mobile Money", "Kotizy"],
  authors: [{ name: "KAH Digital", url: "https://kah-digital.ch" }],
  creator: "KAH Digital",
  metadataBase: new URL(APP_URL),
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "Kotizy",
    title: "Kotizy — La tontine de la diaspora",
    description: "Épargnez ensemble en euros. Tontines digitales pour la diaspora africaine. Wave, Orange Money, Stripe.",
    images: [{ url: `${APP_URL}/og`, width: 1200, height: 630, alt: "Kotizy — La tontine de la diaspora" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kotizy — La tontine de la diaspora",
    description: "Épargnez ensemble en euros. Tontines digitales pour la diaspora africaine.",
    images: [`${APP_URL}/og`],
    creator: "@DigitalKah42",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kotizy",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050706",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const initialLang: Lang = store.get("kl")?.value === "en" ? "en" : "fr";

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider initialLang={initialLang}>
            <PwaRegister />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
