"use client";

import { Bell, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

type Pref = { notifEcheance: boolean; notifChat: boolean; mobileMoneyTest: boolean };

const DEFAULT: Pref = { notifEcheance: true, notifChat: true, mobileMoneyTest: false };
const KEY = "kotizy_prefs";

function loadPrefs(): Pref {
  if (typeof window === "undefined") return DEFAULT;
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; }
  catch { return DEFAULT; }
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-white/20"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

export function SettingsToggles() {
  const [prefs, setPrefs] = useState<Pref>(DEFAULT);
  const { t } = useLanguage();

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  function toggle(key: keyof Pref) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const items = [
    { key: "notifEcheance" as keyof Pref, icon: Bell, title: t("settingsToggles", "deadlineTitle"), desc: t("settingsToggles", "deadlineDesc") },
    { key: "notifChat" as keyof Pref, icon: Bell, title: t("settingsToggles", "chatTitle"), desc: t("settingsToggles", "chatDesc") },
    { key: "mobileMoneyTest" as keyof Pref, icon: Smartphone, title: t("settingsToggles", "mobileMoneyTitle"), desc: t("settingsToggles", "mobileMoneyDesc") },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ key, icon: Icon, title, desc }) => (
        <div key={key} className="glass flex items-center gap-3 rounded-3xl p-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <Icon size={18} className="text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black">{title}</p>
            <p className="text-sm text-smoke">{desc}</p>
          </div>
          <Toggle on={prefs[key]} onToggle={() => toggle(key)} />
        </div>
      ))}
    </div>
  );
}
