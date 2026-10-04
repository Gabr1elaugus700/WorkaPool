import type { OverviewCustomerGroupQuoteStatusCounts } from "../../utils/overviewCustomerGroupQuotesFilter.utils";
import { OverviewCustomerGroupQuoteRevealToggle } from "./OverviewCustomerGroupQuoteRevealToggle";
import { OverviewCustomerGroupQuoteSummaryBadges } from "./OverviewCustomerGroupQuoteSummaryBadges";

export const OVERVIEW_CUSTOMER_GROUP_QUOTES_TITLE =
  "Histórico Comparativo de Cotações & Pedidos por Produto";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_DESCRIPTION =
  "Cotações ganhas e perdidas do produto nos últimos 12 dias.";

type OverviewCustomerGroupQuotesHeaderProps = {
  summaryCounts: OverviewCustomerGroupQuoteStatusCounts;
  otherCustomerCount: number;
  revealAvailable: boolean;
  reveal: boolean;
  onRevealChange: (reveal: boolean) => void;
};

export function OverviewCustomerGroupQuotesHeader({
  summaryCounts,
  otherCustomerCount,
  revealAvailable,
  reveal,
  onRevealChange,
}: OverviewCustomerGroupQuotesHeaderProps) {
  return (
    <header className="space-y-3 border-b border-border/60 pb-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">
            {OVERVIEW_CUSTOMER_GROUP_QUOTES_TITLE}
          </h3>
          <p className="text-xs text-muted-foreground">
            {OVERVIEW_CUSTOMER_GROUP_QUOTES_DESCRIPTION}
          </p>
        </div>
        {revealAvailable ? (
          <OverviewCustomerGroupQuoteRevealToggle
            otherCustomerCount={otherCustomerCount}
            reveal={reveal}
            onRevealChange={onRevealChange}
          />
        ) : null}
      </div>
      <OverviewCustomerGroupQuoteSummaryBadges counts={summaryCounts} />
    </header>
  );
}
