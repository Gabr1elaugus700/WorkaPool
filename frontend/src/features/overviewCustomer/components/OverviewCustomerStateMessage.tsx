import { cn } from "@/lib/utils";

type OverviewCustomerStateTone = "muted" | "destructive";

type OverviewCustomerStateMessageProps = {
  message: string;
  tone?: OverviewCustomerStateTone;
  className?: string;
};

export function OverviewCustomerStateMessage({
  message,
  tone = "muted",
  className,
}: OverviewCustomerStateMessageProps) {
  const isDestructive = tone === "destructive";

  return (
    <p
      role={isDestructive ? "alert" : "status"}
      aria-live={isDestructive ? "assertive" : "polite"}
      className={cn(
        "text-sm",
        isDestructive ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {message}
    </p>
  );
}
