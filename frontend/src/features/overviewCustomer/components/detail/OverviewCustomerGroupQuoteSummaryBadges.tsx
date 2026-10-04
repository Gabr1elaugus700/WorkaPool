import { cn } from "@/lib/utils";
import type { OverviewCustomerGroupQuoteStatusCounts } from "../../utils/overviewCustomerGroupQuotesFilter.utils";

const BADGES: {
  key: keyof OverviewCustomerGroupQuoteStatusCounts;
  label: string;
  className: string;
}[] = [
  { key: "todas", label: "Total", className: "border-border bg-muted/40 text-foreground" },
  { key: "ganhas", label: "Ganhas", className: "border-primary/40 bg-primary/10 text-primary" },
  {
    key: "perdidas",
    label: "Perdidas",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  { key: "outros", label: "Outros", className: "border-border bg-muted text-muted-foreground" },
];

export function OverviewCustomerGroupQuoteSummaryBadges({
  counts,
}: {
  counts: OverviewCustomerGroupQuoteStatusCounts;
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Resumo das cotações">
      {BADGES.map((badge) => (
        <li
          key={badge.key}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            badge.className,
          )}
        >
          {badge.label}
          <span className="font-semibold tabular-nums">{counts[badge.key]}</span>
        </li>
      ))}
    </ul>
  );
}
