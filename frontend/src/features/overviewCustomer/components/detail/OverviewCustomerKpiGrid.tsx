import React from "react";
import type { OverviewCustomerDetailResponse } from "../../types/overviewCustomerDetail.types";
import {
  formatOverviewCurrency,
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";
import { OverviewCustomerKpiTile } from "./OverviewCustomerKpiTile";

type OverviewCustomerKpiGridProps = {
  summary: OverviewCustomerDetailResponse["commercialSummary"];
};

function formatNullableNumber(value: number | null): string {
  if (value == null) {
    return "Não informado";
  }
  return formatOverviewNumber(value);
}

export function OverviewCustomerKpiGrid({ summary }: OverviewCustomerKpiGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <OverviewCustomerKpiTile
        label="Faturamento (desde Jan/2024)"
        value={formatOverviewCurrency(summary.revenueSinceJan2024)}
        subLabel={`Últimos 12m: ${formatOverviewCurrency(summary.revenueLast12Months)}`}
      />
      <OverviewCustomerKpiTile
        label="Volume (desde Jan/2024)"
        value={formatOverviewNumber(summary.volumeSinceJan2024)}
        subLabel={`Últimos 12m: ${formatOverviewNumber(summary.volumeLast12Months)}`}
      />
      <OverviewCustomerKpiTile
        label="Pedidos (desde Jan/2024)"
        value={formatOverviewNumber(summary.orderCountSinceJan2024)}
        subLabel={`Ticket médio: ${formatOverviewCurrency(summary.averageTicketSinceJan2024)}`}
      />
      <OverviewCustomerKpiTile
        label="Margem ponderada"
        value={formatOverviewPercent(summary.marginPercentWeightedByRevenue)}
      />
      <OverviewCustomerKpiTile
        label="Frequência média (dias)"
        value={formatNullableNumber(summary.purchaseFrequencyDays)}
      />
      <OverviewCustomerKpiTile
        label="Dias desde última compra"
        value={formatNullableNumber(summary.daysSinceLastPurchase)}
      />
    </div>
  );
}
