"use client";

import { useLanguage } from "@/lib/i18n/context";

export function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "fr" ? "en" : "fr")}
      className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface)] text-[10px] font-black text-[var(--muted)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
      aria-label="Switch language"
      title={lang === "fr" ? "Switch to English" : "Passer en français"}
    >
      {lang === "fr" ? "EN" : "FR"}
    </button>
  );
}
