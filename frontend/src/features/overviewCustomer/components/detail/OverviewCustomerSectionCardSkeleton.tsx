import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React from "react";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";

type OverviewCustomerSectionCardSkeletonProps = {
  title: string;
  description?: string;
  contentClassName?: string;
  skeletonClassName?: string;
  loadingLabel: string;
};

export function OverviewCustomerSectionCardSkeleton({
  title,
  description,
  contentClassName,
  skeletonClassName,
  loadingLabel,
}: OverviewCustomerSectionCardSkeletonProps) {
  return (
    <OverviewCustomerSectionCard
      title={title}
      description={description}
      className="border-muted"
      contentClassName={cn("py-1", contentClassName)}
    >
      <Skeleton
        className={cn("w-full rounded-md", skeletonClassName ?? "h-32")}
        aria-hidden="true"
      />
      <span className="sr-only">{loadingLabel}</span>
    </OverviewCustomerSectionCard>
  );
}
