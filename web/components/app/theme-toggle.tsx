"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme !== "light";

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-11 w-11 rounded-full p-0"
      aria-label="Changer de theme"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
