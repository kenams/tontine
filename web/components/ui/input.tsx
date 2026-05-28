import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10 light:border-ink/15 light:bg-ink/5",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10 light:border-ink/15 light:bg-ink/5",
        className
      )}
      {...props}
    />
  );
}
