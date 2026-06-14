import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/tontine-en-ligne",
          "/tontine-en-ligne/mali",
          "/tontine-en-ligne/senegal",
          "/tontine-en-ligne/cote-divoire",
          "/tontine-en-ligne/cameroun",
          "/tontine-diaspora",
          "/marketplace",
          "/download",
          "/install-ios",
          "/legal/",
        ],
        disallow: [
          "/dashboard",
          "/admin",
          "/api/",
          "/profile",
          "/settings",
          "/wallet",
          "/tontines/create",
          "/tontines/",
          "/transactions",
          "/notifications",
          "/chat",
          "/onboarding",
          "/referral",
          "/org",
          "/u/",
          "/g/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: "https://tontineapp-web.vercel.app/sitemap.xml",
  };
}
