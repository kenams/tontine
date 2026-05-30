import { MobileShellSkeleton, Skeleton } from "@/components/app/skeleton";

export default function WalletLoading() {
  return (
    <MobileShellSkeleton>
      <Skeleton className="mb-2 h-4 w-12" />
      <Skeleton className="mb-5 h-7 w-24" />
      <Skeleton className="mb-4 h-32 rounded-3xl" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-20 rounded-3xl" />
      </div>
      <Skeleton className="mb-3 h-12 rounded-3xl" />
      <Skeleton className="mb-3 h-12 rounded-3xl" />
      <Skeleton className="mb-3 h-12 rounded-3xl" />
      <Skeleton className="mb-3 h-12 rounded-3xl" />
    </MobileShellSkeleton>
  );
}
