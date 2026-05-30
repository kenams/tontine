import { MobileShellSkeleton, Skeleton } from "@/components/app/skeleton";

export default function ProfileLoading() {
  return (
    <MobileShellSkeleton>
      <div className="mb-6 flex flex-col items-center gap-3">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="mb-3 h-24 rounded-3xl" />
      <Skeleton className="mb-3 h-36 rounded-3xl" />
      <Skeleton className="mb-3 h-16 rounded-3xl" />
      <Skeleton className="h-16 rounded-3xl" />
    </MobileShellSkeleton>
  );
}
