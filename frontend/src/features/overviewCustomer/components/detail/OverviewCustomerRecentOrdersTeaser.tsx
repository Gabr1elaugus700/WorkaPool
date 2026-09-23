import { Button } from "@/components/ui/button";
import { CircleCheck } from "lucide-react";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { formatOverviewNumber } from "../../utils/overviewCustomerFormatters";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerRecentInvoicedOrdersList } from "./OverviewCustomerRecentInvoicedOrdersList";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";

type OverviewCustomerRecentOrdersTeaserProps = {
  invoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  invoicedCountLast12Months?: number | null;
  isLoading: boolean;
  isError: boolean;
  onViewAll: () => void;
};

const TEASER_LIMIT = 5;

export function OverviewCustomerRecentOrdersTeaser({
  invoicedOrders,
  invoicedCountLast12Months = null,
  isLoading,
  isError,
  onViewAll,
}: OverviewCustomerRecentOrdersTeaserProps) {
  const title = "Pedidos faturados recentes";
  const description = "Últimas vitórias comerciais com valor, volume, margem e itens.";
  const leading = (
    <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
      <CircleCheck aria-hidden="true" className="size-4" />
    </span>
  );

  if (isLoading) {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={title}
        description={description}
        skeletonClassName="h-28"
        loadingLabel="Carregando pedidos faturados recentes deste cliente."
      />
    );
  }

  if (isError) {
    return (
      <OverviewCustomerSectionCard
        title={title}
        description={description}
        leading={leading}
        className="border-muted"
        contentClassName="py-1"
      >
        <OverviewCustomerStateMessage
          message="Não foi possível carregar pedidos faturados recentes. Tente novamente."
          tone="destructive"
        />
      </OverviewCustomerSectionCard>
    );
  }

  const visibleCount = Math.min(invoicedOrders.length, TEASER_LIMIT);
  const countLabel =
    invoicedCountLast12Months != null
      ? `Total (12 meses): ${formatOverviewNumber(invoicedCountLast12Months)} faturas`
      : null;
  const shownLabel =
    visibleCount === 1 ? "Exibindo 1 fatura recente" : `Exibindo ${visibleCount} faturas recentes`;
  const ofTotalLabel =
    invoicedCountLast12Months != null
      ? ` de ${formatOverviewNumber(invoicedCountLast12Months)} nos últimos 12 meses.`
      : ".";

  return (
    <OverviewCustomerSectionCard
      title={title}
      description={description}
      leading={leading}
      trailing={
        countLabel ? (
          <p className="text-xs font-medium tabular-nums text-muted-foreground">{countLabel}</p>
        ) : null
      }
      className="border-primary/20"
      contentClassName="space-y-3"
    >
      <OverviewCustomerRecentInvoicedOrdersList
        rows={invoicedOrders}
        isLoading={false}
        isError={false}
        limit={TEASER_LIMIT}
      />
      {visibleCount > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {shownLabel}
            {ofTotalLabel}
          </p>
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onViewAll}>
            Ver movimentação completa
          </Button>
        </div>
      ) : (
        <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onViewAll}>
          Ver movimentação completa
        </Button>
      )}
    </OverviewCustomerSectionCard>
  );
}
