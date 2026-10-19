import { Link } from "react-router-dom";
import { filterIbcPageTabs, type IbcPageTab } from "../utils/filterIbcPageTabs";

type Props = {
  tabs: readonly IbcPageTab[];
  activeId: string;
  userRole?: string;
  ariaLabel: string;
};

export default function IbcPageTabs({ tabs, activeId, userRole, ariaLabel }: Props) {
  return (
    <nav className="flex flex-wrap items-center gap-3" aria-label={ariaLabel}>
      {filterIbcPageTabs(tabs, userRole).map((tab) => {
        const current = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={current ? "page" : undefined}
            className={
              current
                ? "rounded-sm text-sm font-semibold text-foreground underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                : "rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
