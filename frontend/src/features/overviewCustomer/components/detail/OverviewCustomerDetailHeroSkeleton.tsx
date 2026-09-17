import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export function OverviewCustomerDetailHeroSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-lg bg-primary text-primary-foreground shadow-sm"
      aria-busy="true"
      aria-label="Carregando identidade do cliente"
    >
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full bg-primary-foreground/20" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 bg-primary-foreground/20" />
            <Skeleton className="h-4 w-32 bg-primary-foreground/20" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full bg-primary-foreground/20" />
              <Skeleton className="h-6 w-24 rounded-full bg-primary-foreground/20" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:min-w-[280px]">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton
              key={`hero-signal-${index}`}
              className="h-14 rounded-md bg-primary-foreground/20"
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 bg-primary-foreground/10 px-4 py-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={`hero-meta-${index}`}
            className="h-4 w-full bg-primary-foreground/20"
          />
        ))}
      </div>
    </section>
  );
}
