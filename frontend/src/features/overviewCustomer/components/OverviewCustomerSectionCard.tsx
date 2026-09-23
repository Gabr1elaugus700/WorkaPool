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
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function OverviewCustomerSectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
  leading,
  trailing,
}: OverviewCustomerSectionCardProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-start gap-3">
            {leading ? <div className="mt-0.5 shrink-0">{leading}</div> : null}
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle id={titleId} className="text-lg">
                {title}
              </CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            {trailing ? <div className="shrink-0">{trailing}</div> : null}
          </div>
        </CardHeader>
        <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
      </Card>
    </section>
  );
}
