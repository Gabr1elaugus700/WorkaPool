import React from "react";
import { Link } from "react-router-dom";
import type {
  OverviewCustomerRecentInvoicedOrder,
  OverviewCustomerRecentLostOrder,
} from "../../types/overviewCustomerRecentCommercialMotion.types";
import { buildOverviewCustomerOrderLossHref } from "../../utils/overviewCustomerOrderLoss.utils";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerCommercialMotionSummary } from "./OverviewCustomerCommercialMotionSummary";
import { OverviewCustomerRecentInvoicedOrdersTable } from "./OverviewCustomerRecentInvoicedOrdersTable";
import { OverviewCustomerRecentLostOrdersTable } from "./OverviewCustomerRecentLostOrdersTable";

type OverviewCustomerDetailMotionPanelProps = {
  customerCode: number;
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months: number | null;
  lostCountLast12Months: number | null;
  recentInvoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  recentLostOrders: OverviewCustomerRecentLostOrder[];
  isLoadingInvoiced: boolean;
  isLoadingLost: boolean;
  isErrorInvoiced: boolean;
  isErrorLost: boolean;
};

export function OverviewCustomerDetailMotionPanel({
  customerCode,
  lastInvoicedPurchaseAt,
  lastLostOrderAt,
  lastCommercialMovementAt,
  invoicedCountLast12Months,
  lostCountLast12Months,
  recentInvoicedOrders,
  recentLostOrders,
  isLoadingInvoiced,
  isLoadingLost,
  isErrorInvoiced,
  isErrorLost,
}: OverviewCustomerDetailMotionPanelProps) {
  return (
    <OverviewCustomerSectionCard
      title="Movimentação comercial recente"
      description="Separação entre faturamento e perda para manter contexto comercial imediato."
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
        <OverviewCustomerRecentInvoicedOrdersTable
          rows={recentInvoicedOrders}
          isLoading={isLoadingInvoiced}
          isError={isErrorInvoiced}
        />
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Pedidos perdidos recentes</h3>
          <Link
            to={buildOverviewCustomerOrderLossHref(customerCode)}
            className="text-xs text-primary underline underline-offset-2"
          >
            Ver no Order Loss
          </Link>
        </div>
        <OverviewCustomerRecentLostOrdersTable
          rows={recentLostOrders}
          isLoading={isLoadingLost}
          isError={isErrorLost}
        />
      </section>
    </OverviewCustomerSectionCard>
  );
}
