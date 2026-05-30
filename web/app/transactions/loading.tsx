import { MobileShellSkeleton, Skeleton } from "@/components/app/skeleton";

export default function TransactionsLoading() {
  return (
    <MobileShellSkeleton>
      <Skeleton className="mb-2 h-4 w-12" />
      <Skeleton className="mb-5 h-7 w-36" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-20 rounded-full" />)}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="mb-3 h-16 rounded-3xl" />
      ))}
    </MobileShellSkeleton>
  );
}
