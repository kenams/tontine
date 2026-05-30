import { MobileShellSkeleton, Skeleton } from "@/components/app/skeleton";

export default function TontinesLoading() {
  return (
    <MobileShellSkeleton>
      <Skeleton className="mb-2 h-4 w-16" />
      <Skeleton className="mb-5 h-7 w-32" />
      <Skeleton className="mb-4 h-12 rounded-3xl" />
      <Skeleton className="mb-3 h-28 rounded-3xl" />
      <Skeleton className="mb-3 h-28 rounded-3xl" />
      <Skeleton className="mb-3 h-28 rounded-3xl" />
      <Skeleton className="h-28 rounded-3xl" />
    </MobileShellSkeleton>
  );
}
