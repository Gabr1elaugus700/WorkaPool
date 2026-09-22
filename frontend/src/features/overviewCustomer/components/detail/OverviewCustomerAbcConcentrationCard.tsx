import { Progress } from "@/components/ui/progress";
import type { OverviewCustomerPurchasedProduct } from "../../types/overviewCustomerPurchasedProducts.types";
import { formatOverviewNumber } from "../../utils/overviewCustomerFormatters";
import { buildAbcConcentrationRows } from "../../utils/overviewCustomerAnalytics.utils";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";

type OverviewCustomerAbcConcentrationCardProps = {
  products: OverviewCustomerPurchasedProduct[];
  isLoading: boolean;
  isError: boolean;
  maxItems?: number;
};

export function OverviewCustomerAbcConcentrationCard({
  products,
  isLoading,
  isError,
  maxItems = 5,
}: OverviewCustomerAbcConcentrationCardProps) {
  const title = "Concentração de mix (curva ABC)";

  if (isLoading) {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={title}
        description="Top produtos por participação no faturamento."
        skeletonClassName="h-40"
        loadingLabel="Carregando concentração de mix deste cliente."
      />
    );
  }

  if (isError) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage
          message="Não foi possível carregar a concentração de mix."
          tone="destructive"
        />
      </OverviewCustomerSectionCard>
    );
  }

  const rows = buildAbcConcentrationRows(products, maxItems);
  if (rows.length === 0) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message="Nenhum produto no mix para este cliente." />
      </OverviewCustomerSectionCard>
    );
  }

  const topShare = rows[0]?.revenueShare ?? 100;

  return (
    <OverviewCustomerSectionCard
      title={title}
      description="Top produtos por participação no faturamento."
      className="border-muted"
      contentClassName="space-y-3"
    >
      <ul className="space-y-3">
        {rows.map((row) => {
          const barWidth = topShare > 0 ? (row.revenueShare / topShare) * 100 : 0;
          return (
            <li key={row.productCode} className="space-y-1.5">
              <div className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.productName}</p>
                  <p className="text-xs text-muted-foreground">{row.productCode}</p>
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatOverviewNumber(row.revenueShare)}%
                </span>
              </div>
              <Progress value={barWidth} className="h-2" />
            </li>
          );
        })}
      </ul>
    </OverviewCustomerSectionCard>
  );
}
