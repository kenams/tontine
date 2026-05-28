import { cn } from "@/lib/cn";

const tone: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 ring-emerald-400/25",
  PAID: "bg-emerald-500/15 text-emerald-400 ring-emerald-400/25",
  OPEN: "bg-emerald-500/15 text-emerald-400 ring-emerald-400/25",
  PENDING: "bg-gold/15 text-gold ring-gold/25",
  REVIEW: "bg-gold/15 text-gold ring-gold/25",
  REVIEWING: "bg-gold/15 text-gold ring-gold/25",
  LATE: "bg-rose-500/15 text-rose-300 ring-rose-300/25",
  FAILED: "bg-rose-500/15 text-rose-300 ring-rose-300/25",
  BANNED: "bg-rose-500/15 text-rose-300 ring-rose-300/25",
  SUSPENDED: "bg-rose-500/15 text-rose-300 ring-rose-300/25"
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ring-1",
        tone[value] ?? "bg-white/10 text-smoke ring-white/10",
        className
      )}
    >
      {value}
    </span>
  );
}
