import "server-only";
import { cookies } from "next/headers";
import { translations, type Lang } from "./translations";

export async function getServerLang(): Promise<Lang> {
  const store = await cookies();
  const val = store.get("kl")?.value;
  return val === "en" ? "en" : "fr";
}

function translate(section: string, key: string, lang: Lang): string {
  const s = translations[section as keyof typeof translations] as Record<string, { fr: string; en: string }>;
  return s?.[key]?.[lang] ?? s?.[key]?.fr ?? key;
}

export async function getServerT() {
  const lang = await getServerLang();
  return {
    lang,
    t: (section: string, key: string) => translate(section, key, lang),
  };
}
