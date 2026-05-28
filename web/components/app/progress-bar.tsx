import { cn } from "@/lib/cn";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]", className)}>
      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
