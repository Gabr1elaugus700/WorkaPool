import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export function OverviewCustomerKpiGridSkeleton() {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando indicadores comerciais"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={`kpi-skeleton-${index}`}
          className="space-y-2 rounded-lg border border-muted bg-card p-4 shadow-sm"
        >
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
