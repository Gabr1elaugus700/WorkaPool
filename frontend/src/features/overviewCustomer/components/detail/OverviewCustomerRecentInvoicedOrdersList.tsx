import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerRecentInvoicedOrderRow } from "./OverviewCustomerRecentInvoicedOrderRow";
import { OverviewCustomerTableSkeleton } from "./OverviewCustomerTableSkeleton";

type OverviewCustomerRecentInvoicedOrdersListProps = {
  rows: OverviewCustomerRecentInvoicedOrder[];
  isLoading: boolean;
  isError: boolean;
  limit?: number;
};

export function OverviewCustomerRecentInvoicedOrdersList({
  rows,
  isLoading,
  isError,
  limit = 5,
}: OverviewCustomerRecentInvoicedOrdersListProps) {
  if (isLoading) {
    return (
      <OverviewCustomerTableSkeleton loadingLabel="Carregando pedidos faturados recentes deste cliente." />
    );
  }

  if (isError) {
    return (
      <OverviewCustomerStateMessage
        message="Não foi possível carregar pedidos faturados recentes. Tente novamente."
        tone="destructive"
      />
    );
  }

  const visibleRows = rows.slice(0, limit);

  if (visibleRows.length === 0) {
    return (
      <OverviewCustomerStateMessage message="Nenhum pedido faturado recente para este cliente." />
    );
  }

  return (
    <ul className="space-y-2">
      {visibleRows.map((order) => (
        <OverviewCustomerRecentInvoicedOrderRow
          key={`invoiced-${order.orderNumber}-${order.occurredAt}`}
          order={order}
        />
      ))}
    </ul>
  );
}
