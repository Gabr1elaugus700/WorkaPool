import { Skeleton } from "@/components/ui/skeleton";
import { OverviewCustomerDetailHeroSkeleton } from "./OverviewCustomerDetailHeroSkeleton";
import { OverviewCustomerKpiGridSkeleton } from "./OverviewCustomerKpiGridSkeleton";

export function OverviewCustomerDetailFirstPaintSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-3 py-6 md:px-6"
      aria-busy="true"
      aria-label="Carregando análise comercial do cliente"
    >
      <header className="space-y-2">
        <Skeleton className="h-3 w-64" />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </header>
      <OverviewCustomerDetailHeroSkeleton />
      <Skeleton className="h-10 w-full max-w-xl" />
      <OverviewCustomerKpiGridSkeleton />
    </div>
  );
}
