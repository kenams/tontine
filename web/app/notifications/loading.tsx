import { MobileShellSkeleton, Skeleton } from "@/components/app/skeleton";

export default function NotificationsLoading() {
  return (
    <MobileShellSkeleton>
      <Skeleton className="mb-5 h-7 w-40" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="mb-3 h-16 rounded-3xl" />
      ))}
    </MobileShellSkeleton>
  );
}
