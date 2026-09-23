import { Button } from "@/components/ui/button";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";

type OverviewCustomerRecentOrdersTeaserProps = {
  invoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  invoicedCountLast12Months?: number | null;
  isLoading: boolean;
  isError: boolean;
  onViewAll: () => void;
};

const TEASER_LIMIT = 3;

export function OverviewCustomerRecentOrdersTeaser({
  invoicedOrders,
  invoicedCountLast12Months = null,
  isLoading,
  isError,
  onViewAll,
}: OverviewCustomerRecentOrdersTeaserProps) {
  const title = "Pedidos faturados recentes";
  const description =
    invoicedCountLast12Months != null
      ? `Últimas vitórias comerciais · Total (12 meses): ${invoicedCountLast12Months} faturas.`
      : "Últimas vitórias comerciais antes de abrir a movimentação completa.";

  if (isLoading) {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={title}
        description={description}
        skeletonClassName="h-20"
        loadingLabel="Carregando pedidos faturados recentes deste cliente."
      />
    );
  }

  if (isError) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage
          message="Não foi possível carregar pedidos faturados recentes. Tente novamente."
          tone="destructive"
        />
      </OverviewCustomerSectionCard>
    );
  }

  const previewOrders = invoicedOrders.slice(0, TEASER_LIMIT);

  return (
    <OverviewCustomerSectionCard
      title={title}
      description={description}
      className="border-muted"
      contentClassName="space-y-3"
    >
      {previewOrders.length === 0 ? (
        <OverviewCustomerStateMessage message="Nenhum pedido faturado recente para este cliente." />
      ) : (
        <ul className="space-y-1 text-sm">
          {previewOrders.map((order) => (
            <li key={`teaser-invoiced-${order.orderNumber}-${order.occurredAt}`} className="font-medium">
              #{order.orderNumber} · {order.occurredAt}
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={onViewAll}>
        Ver movimentação completa
      </Button>
    </OverviewCustomerSectionCard>
  );
}
