export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.07] ${className}`} />;
}

export function MobileShellSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-transparent">
      <header className="sticky top-0 z-30 border-b border-[var(--surface-strong)] bg-[var(--bg)]/80 px-4 py-3 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-[var(--surface-strong)] bg-[var(--bg)]/92 px-3 py-2 backdrop-blur-2xl">
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      </nav>
    </div>
  );
}
