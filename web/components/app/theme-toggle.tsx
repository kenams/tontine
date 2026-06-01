"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme !== "light";

  return (
    <button
      type="button"
      className="grid h-9 w-9 place-items-center rounded-xl text-[var(--muted)] transition hover:text-[var(--text)]"
      aria-label="Changer de theme"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
