import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

type OverviewCustomerSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function OverviewCustomerSectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: OverviewCustomerSectionCardProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="space-y-1 pb-3">
          <CardTitle id={titleId} className="text-lg">
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
      </Card>
    </section>
  );
}
