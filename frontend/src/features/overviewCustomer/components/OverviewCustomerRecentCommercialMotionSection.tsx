import React from "react";
import type {
  OverviewCustomerRecentInvoicedOrder,
  OverviewCustomerRecentLostOrder,
} from "../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerSectionCard } from "./OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "./OverviewCustomerStateMessage";

type Props = {
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  recentInvoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  recentLostOrders: OverviewCustomerRecentLostOrder[];
  isLoadingInvoiced: boolean;
  isLoadingLost: boolean;
  isErrorInvoiced: boolean;
  isErrorLost: boolean;
};

export function OverviewCustomerRecentCommercialMotionSection({
  lastInvoicedPurchaseAt,
  lastLostOrderAt,
  lastCommercialMovementAt,
  recentInvoicedOrders,
  recentLostOrders,
  isLoadingInvoiced,
  isLoadingLost,
  isErrorInvoiced,
  isErrorLost,
}: Props) {
  return (
    <OverviewCustomerSectionCard
      title="Movimentação comercial recente"
      description="Separação entre faturamento e perda para manter contexto comercial imediato."
      className="border-muted"
      contentClassName="space-y-4"
    >
      <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Última compra (NF faturada)</dt>
          <dd className="font-medium">{lastInvoicedPurchaseAt ?? "Não informado"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Último pedido perdido</dt>
          <dd className="font-medium">{lastLostOrderAt ?? "Não informado"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Última movimentação comercial</dt>
          <dd className="font-medium">{lastCommercialMovementAt ?? "Não informado"}</dd>
        </div>
      </dl>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Pedidos faturados recentes</h3>
        {renderInvoicedSlice(isLoadingInvoiced, isErrorInvoiced, recentInvoicedOrders)}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Pedidos perdidos recentes</h3>
        {renderLostSlice(isLoadingLost, isErrorLost, recentLostOrders)}
      </section>
    </OverviewCustomerSectionCard>
  );
}

function renderInvoicedSlice(
  isLoading: boolean,
  isError: boolean,
  rows: OverviewCustomerRecentInvoicedOrder[],
) {
  if (isLoading) {
    return (
      <OverviewCustomerStateMessage message="Carregando pedidos faturados recentes deste cliente." />
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
  if (rows.length === 0) {
    return (
      <OverviewCustomerStateMessage message="Nenhum pedido faturado recente para este cliente." />
    );
  }

  return (
    <ul className="space-y-1 text-sm">
      {rows.map((row) => (
        <li key={`invoiced-${row.orderNumber}-${row.occurredAt}`} className="font-medium">
          #{row.orderNumber} - {row.occurredAt}
        </li>
      ))}
    </ul>
  );
}

function renderLostSlice(
  isLoading: boolean,
  isError: boolean,
  rows: OverviewCustomerRecentLostOrder[],
) {
  if (isLoading) {
    return (
      <OverviewCustomerStateMessage message="Carregando pedidos perdidos recentes deste cliente." />
    );
  }
  if (isError) {
    return (
      <OverviewCustomerStateMessage
        message="Não foi possível carregar pedidos perdidos recentes. Tente novamente."
        tone="destructive"
      />
    );
  }
  if (rows.length === 0) {
    return (
      <OverviewCustomerStateMessage message="Nenhum pedido perdido recente para este cliente." />
    );
  }

  return (
    <ul className="space-y-1 text-sm">
      {rows.map((row) => (
        <li key={`lost-${row.orderNumber}-${row.occurredAt}`} className="font-medium">
          #{row.orderNumber} - {row.occurredAt}
        </li>
      ))}
    </ul>
  );
}
