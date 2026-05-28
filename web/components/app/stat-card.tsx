import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon,
  accent = false
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn("glass min-w-0 rounded-3xl p-4", accent && "bg-emerald-500/15")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase text-smoke">{label}</p>
        {icon ? <div className="text-emerald-400">{icon}</div> : null}
      </div>
      <p className="break-words text-xl font-black leading-tight tracking-normal sm:text-2xl">{value}</p>
    </div>
  );
}
