import React from "react";
import type { OverviewCustomerDetailResponse } from "../types/overviewCustomerDetail.types";

type Props = {
  summary: OverviewCustomerDetailResponse["commercialSummary"];
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function OverviewCustomerCommercialSummaryCard({ summary }: Props) {
  return (
    <section className="rounded-md border p-4">
      <h2 className="text-lg font-semibold">Resumo comercial</h2>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        <div>
          <dt className="font-medium">Faturamento (desde Jan/2024)</dt>
          <dd>{formatCurrency(summary.revenueSinceJan2024)}</dd>
        </div>
        <div>
          <dt className="font-medium">Faturamento (últimos 12 meses)</dt>
          <dd>{formatCurrency(summary.revenueLast12Months)}</dd>
        </div>
        <div>
          <dt className="font-medium">Pedidos (desde Jan/2024)</dt>
          <dd>{formatNumber(summary.orderCountSinceJan2024)}</dd>
        </div>
        <div>
          <dt className="font-medium">Pedidos (últimos 12 meses)</dt>
          <dd>{formatNumber(summary.orderCountLast12Months)}</dd>
        </div>
        <div>
          <dt className="font-medium">Ticket médio (desde Jan/2024)</dt>
          <dd>{formatCurrency(summary.averageTicketSinceJan2024)}</dd>
        </div>
        <div>
          <dt className="font-medium">Ticket médio (últimos 12 meses)</dt>
          <dd>{formatCurrency(summary.averageTicketLast12Months)}</dd>
        </div>
        <div>
          <dt className="font-medium">Volume (desde Jan/2024)</dt>
          <dd>{formatNumber(summary.volumeSinceJan2024)}</dd>
        </div>
        <div>
          <dt className="font-medium">Volume (últimos 12 meses)</dt>
          <dd>{formatNumber(summary.volumeLast12Months)}</dd>
        </div>
        <div>
          <dt className="font-medium">Margem ponderada por faturamento</dt>
          <dd>
            {summary.marginPercentWeightedByRevenue == null
              ? "-"
              : `${formatNumber(summary.marginPercentWeightedByRevenue)}%`}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Frequência média de compra (dias)</dt>
          <dd>
            {summary.purchaseFrequencyDays == null
              ? "-"
              : formatNumber(summary.purchaseFrequencyDays)}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Dias desde a última compra</dt>
          <dd>
            {summary.daysSinceLastPurchase == null
              ? "-"
              : formatNumber(summary.daysSinceLastPurchase)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
