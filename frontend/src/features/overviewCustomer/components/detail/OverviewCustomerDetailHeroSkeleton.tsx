import { Skeleton } from "@/components/ui/skeleton";

export function OverviewCustomerDetailHeroSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-lg border border-border/80 bg-foreground text-background shadow-sm"
      aria-busy="true"
      aria-label="Carregando identidade do cliente"
    >
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-lg bg-background/20" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 bg-background/20" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full bg-background/20" />
              <Skeleton className="h-6 w-20 rounded-full bg-background/20" />
            </div>
            <Skeleton className="h-4 w-72 bg-background/20" />
            <Skeleton className="h-4 w-32 bg-background/20" />
          </div>
        </div>
        <div className="w-full space-y-3 rounded-lg border border-background/15 bg-background/10 p-4 md:max-w-md">
          <Skeleton className="h-4 w-36 bg-background/20" />
          <Skeleton className="h-9 w-24 bg-background/20" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={`hero-signal-${index}`}
                className="h-12 rounded-md bg-background/20"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 border-t border-border/80 bg-card sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={`hero-meta-${index}`} className="space-y-2 px-4 py-3">
            <Skeleton className="h-3 w-24 bg-muted" />
            <Skeleton className="h-4 w-full bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
