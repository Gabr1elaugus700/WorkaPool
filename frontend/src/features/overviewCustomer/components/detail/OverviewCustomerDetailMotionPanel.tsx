import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerCommercialMotionSummary } from "./OverviewCustomerCommercialMotionSummary";
import { OverviewCustomerRecentInvoicedOrdersList } from "./OverviewCustomerRecentInvoicedOrdersList";

type OverviewCustomerDetailMotionPanelProps = {
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months: number | null;
  lostCountLast12Months: number | null;
  recentInvoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  isLoadingInvoiced: boolean;
  isErrorInvoiced: boolean;
};

export function OverviewCustomerDetailMotionPanel({
  lastInvoicedPurchaseAt,
  lastLostOrderAt,
  lastCommercialMovementAt,
  invoicedCountLast12Months,
  lostCountLast12Months,
  recentInvoicedOrders,
  isLoadingInvoiced,
  isErrorInvoiced,
}: OverviewCustomerDetailMotionPanelProps) {
  return (
    <OverviewCustomerSectionCard
      title="Movimentação comercial recente"
      description="Últimos pedidos faturados com valor, volume, margem e itens expansíveis."
      className="border-muted"
      contentClassName="space-y-4"
    >
      <OverviewCustomerCommercialMotionSummary
        lastInvoicedPurchaseAt={lastInvoicedPurchaseAt}
        lastLostOrderAt={lastLostOrderAt}
        lastCommercialMovementAt={lastCommercialMovementAt}
        invoicedCountLast12Months={invoicedCountLast12Months}
        lostCountLast12Months={lostCountLast12Months}
      />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Pedidos faturados recentes</h3>
        <OverviewCustomerRecentInvoicedOrdersList
          rows={recentInvoicedOrders}
          isLoading={isLoadingInvoiced}
          isError={isErrorInvoiced}
        />
      </section>
    </OverviewCustomerSectionCard>
  );
}
