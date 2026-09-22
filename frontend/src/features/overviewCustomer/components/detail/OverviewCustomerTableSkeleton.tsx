import { Skeleton } from "@/components/ui/skeleton";

type OverviewCustomerTableSkeletonProps = {
  rowCount?: number;
  loadingLabel: string;
};

export function OverviewCustomerTableSkeleton({
  rowCount = 3,
  loadingLabel,
}: OverviewCustomerTableSkeletonProps) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label={loadingLabel}>
      {Array.from({ length: rowCount }, (_, index) => (
        <Skeleton key={`table-row-skeleton-${index}`} className="h-8 w-full" />
      ))}
      <span className="sr-only">{loadingLabel}</span>
    </div>
  );
}
