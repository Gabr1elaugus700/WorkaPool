import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  EXPEDICAO_IBC_SECTIONS,
  type ExpedicaoIbcSection,
} from "../utils/expedicaoIbcSections";
import type { ExpedicaoIbcTabCounts } from "../hooks/useExpedicaoIbcTabCounts";

type Props = {
  activeId: ExpedicaoIbcSection;
  counts: ExpedicaoIbcTabCounts;
};

function TabCountBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums",
        active
          ? "bg-amber-100 text-amber-800"
          : "bg-muted text-muted-foreground",
      )}
      aria-hidden
    >
      {count}
    </span>
  );
}

export default function ExpedicaoIbcPageTabs({ activeId, counts }: Props) {
  return (
    <nav
      className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-1.5"
      aria-label="Expedição IBC"
    >
      {EXPEDICAO_IBC_SECTIONS.map((tab) => {
        const current = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current
                ? "border border-border bg-card font-semibold text-foreground shadow-sm"
                : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            <TabCountBadge count={counts[tab.id]} active={current} />
          </Link>
        );
      })}
    </nav>
  );
}