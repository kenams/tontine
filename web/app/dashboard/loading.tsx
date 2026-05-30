import { MobileShellSkeleton, Skeleton } from "@/components/app/skeleton";

export default function DashboardLoading() {
  return (
    <MobileShellSkeleton>
      <Skeleton className="mb-2 h-4 w-16" />
      <Skeleton className="mb-1 h-7 w-40" />
      <Skeleton className="mb-5 h-3 w-64" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Skeleton className="col-span-2 h-20 rounded-3xl" />
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-16 rounded-3xl" />
      </div>
      <Skeleton className="mb-4 h-24 rounded-3xl" />
      <Skeleton className="mb-4 h-36 rounded-3xl" />
      <Skeleton className="mb-3 h-20 rounded-3xl" />
      <Skeleton className="mb-3 h-20 rounded-3xl" />
      <Skeleton className="h-48 rounded-3xl" />
    </MobileShellSkeleton>
  );
}
