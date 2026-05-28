import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
};

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-emerald-500 text-ink shadow-glow hover:bg-emerald-400",
        variant === "secondary" && "bg-white/10 text-ivory ring-1 ring-white/10 hover:bg-white/15",
        variant === "ghost" && "bg-transparent text-smoke hover:bg-white/10 hover:text-ivory",
        variant === "danger" && "bg-rose-500/90 text-white hover:bg-rose-500",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
