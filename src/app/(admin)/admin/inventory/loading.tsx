import { AdminTableSkeleton } from "@/components/ui/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInventoryLoading() {
  return (
    <div aria-busy="true" aria-label="Loading inventory">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" rounded="lg" />
        ))}
      </div>
      <AdminTableSkeleton />
    </div>
  );
}
