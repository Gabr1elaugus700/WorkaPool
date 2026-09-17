import React from "react";
import type { OverviewCustomerDetailResponse } from "../types/overviewCustomerDetail.types";
import {
  formatOverviewCurrency,
  formatOverviewNumber,
  formatOverviewPercent,
} from "../utils/overviewCustomerFormatters";
import { OverviewCustomerSectionCard } from "./OverviewCustomerSectionCard";

type Props = {
  summary: OverviewCustomerDetailResponse["commercialSummary"];
};

export function OverviewCustomerCommercialSummaryCard({ summary }: Props) {
  return (
    <OverviewCustomerSectionCard
      title="Resumo comercial"
      description="Indicadores consolidados de faturamento, pedidos, ticket e frequência."
      className="border-muted"
    >
      <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 md:gap-4">
        <div>
          <dt className="text-muted-foreground">Faturamento (desde Jan/2024)</dt>
          <dd className="tabular-nums">{formatOverviewCurrency(summary.revenueSinceJan2024)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Faturamento (últimos 12 meses)</dt>
          <dd className="tabular-nums">{formatOverviewCurrency(summary.revenueLast12Months)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pedidos (desde Jan/2024)</dt>
          <dd className="tabular-nums">{formatOverviewNumber(summary.orderCountSinceJan2024)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pedidos (últimos 12 meses)</dt>
          <dd className="tabular-nums">{formatOverviewNumber(summary.orderCountLast12Months)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ticket médio (desde Jan/2024)</dt>
          <dd className="tabular-nums">
            {formatOverviewCurrency(summary.averageTicketSinceJan2024)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ticket médio (últimos 12 meses)</dt>
          <dd className="tabular-nums">
            {formatOverviewCurrency(summary.averageTicketLast12Months)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Volume (desde Jan/2024)</dt>
          <dd className="tabular-nums">{formatOverviewNumber(summary.volumeSinceJan2024)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Volume (últimos 12 meses)</dt>
          <dd className="tabular-nums">{formatOverviewNumber(summary.volumeLast12Months)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Margem ponderada por faturamento</dt>
          <dd className="tabular-nums">{formatOverviewPercent(summary.marginPercentWeightedByRevenue)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Frequência média de compra (dias)</dt>
          <dd className="tabular-nums">
            {summary.purchaseFrequencyDays == null
              ? "Não informado"
              : formatOverviewNumber(summary.purchaseFrequencyDays)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dias desde a última compra</dt>
          <dd className="tabular-nums">
            {summary.daysSinceLastPurchase == null
              ? "Não informado"
              : formatOverviewNumber(summary.daysSinceLastPurchase)}
          </dd>
        </div>
      </dl>
    </OverviewCustomerSectionCard>
  );
}
