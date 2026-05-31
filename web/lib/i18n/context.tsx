"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { translations, type Lang } from "./translations";

type LanguageCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (section: string, key: string) => string;
};

const Ctx = createContext<LanguageCtx>({
  lang: "fr",
  setLang: () => {},
  t: (section, key) => {
    const s = translations[section as keyof typeof translations] as Record<string, { fr: string; en: string }>;
    return s?.[key]?.fr ?? key;
  },
});

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `kl=${l};path=/;max-age=31536000;samesite=lax`;
    router.refresh(); // re-fetch server components avec la nouvelle langue
  }, [router]);

  const t = useCallback(
    (section: string, key: string): string => {
      const s = translations[section as keyof typeof translations] as Record<string, { fr: string; en: string }>;
      return s?.[key]?.[lang] ?? s?.[key]?.fr ?? key;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLanguage() {
  return useContext(Ctx);
}
