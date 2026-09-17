import { Button } from "@/components/ui/button";
import React from "react";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";

type OverviewCustomerRecentOrdersTeaserProps = {
  invoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  isLoading: boolean;
  isError: boolean;
  onViewAll: () => void;
};

const TEASER_LIMIT = 3;

export function OverviewCustomerRecentOrdersTeaser({
  invoicedOrders,
  isLoading,
  isError,
  onViewAll,
}: OverviewCustomerRecentOrdersTeaserProps) {
  const title = "Pedidos faturados recentes";

  if (isLoading) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message="Carregando pedidos faturados recentes deste cliente." />
      </OverviewCustomerSectionCard>
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
      description="Últimas vitórias comerciais antes de abrir a movimentação completa."
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
